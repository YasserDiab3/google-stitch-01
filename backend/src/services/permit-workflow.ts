import { supabaseAdmin } from "../lib/supabase.js";
import type { AuthenticatedUser } from "../middleware/auth.js";
import type { UserRole } from "../config/modules.js";

export type PermitWorkflowRow = {
  id: string;
  permit_no: string;
  work_type: string;
  area: string | null;
  requested_by: string | null;
  approved_by: string | null;
  status: string;
  valid_from: string | null;
  valid_to: string | null;
  created_at: string;
  updated_at: string;
  description: string | null;
  contractor_name: string | null;
  current_step: string;
  area_manager_status: string;
  quality_status: string;
  safety_status: string;
  permit_approver_status: string;
  rejection_reason: string | null;
  opened_at: string | null;
  opened_by: string | null;
  final_approved_at: string | null;
  exported_at: string | null;
};

export type PermitNotificationRow = {
  id: string;
  permit_id: string;
  event_type: string;
  recipient_role: string;
  message: string;
  created_by: string | null;
  is_read: boolean;
  created_at: string;
};

type CreatePermitPayload = {
  permit_no: string;
  work_type: string;
  area?: string | null;
  description?: string | null;
  contractor_name?: string | null;
  requested_by?: string | null;
  valid_from?: string | null;
  valid_to?: string | null;
};

type DecisionAction = "approve" | "reject";

const workflowOrder = [
  "area_manager",
  "quality",
  "safety",
  "permit_approver"
] as const;

type WorkflowStep = (typeof workflowOrder)[number];

const stepLabels: Record<WorkflowStep, string> = {
  area_manager: "مديرة المنطقة",
  quality: "الجودة",
  safety: "السلامة",
  permit_approver: "معتمد التصريح"
};

function getActorCapabilities(role: UserRole): WorkflowStep[] {
  if (role === "admin") {
    return [...workflowOrder];
  }

  if (role === "area_manager") {
    return ["area_manager"];
  }

  if (role === "quality") {
    return ["quality"];
  }

  if (role === "safety" || role === "ehs_manager") {
    return ["safety"];
  }

  if (role === "permit_approver" || role === "supervisor") {
    return ["permit_approver"];
  }

  return [];
}

function ensurePermitDecisionAccess(user: AuthenticatedUser, permit: PermitWorkflowRow) {
  const allowedSteps = getActorCapabilities(user.role);
  if (!allowedSteps.length || !allowedSteps.includes(permit.current_step as WorkflowStep)) {
    throw new Error("ليس لديك صلاحية اعتماد هذه المرحلة من التصريح");
  }
}

async function insertNotification(
  permitId: string,
  eventType: string,
  recipientRole: string,
  message: string,
  createdBy: string | null
) {
  const { error } = await supabaseAdmin.from("permit_notifications").insert({
    permit_id: permitId,
    event_type: eventType,
    recipient_role: recipientRole,
    message,
    created_by: createdBy,
    is_read: false
  });

  if (error) {
    throw error;
  }
}

function getNextStep(step: WorkflowStep): WorkflowStep | null {
  const index = workflowOrder.indexOf(step);
  return workflowOrder[index + 1] ?? null;
}

export async function listPermitsToWorkRows() {
  const { data, error } = await supabaseAdmin
    .from("permits_to_work")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    throw error;
  }

  return (data || []) as PermitWorkflowRow[];
}

export async function createPermitToWorkWorkflow(
  user: AuthenticatedUser,
  payload: CreatePermitPayload
) {
  const insertPayload = {
    permit_no: payload.permit_no,
    work_type: payload.work_type,
    area: payload.area ?? null,
    description: payload.description ?? null,
    contractor_name: payload.contractor_name ?? null,
    requested_by: payload.requested_by ?? user.id,
    status: "submitted",
    current_step: "area_manager",
    area_manager_status: "pending",
    quality_status: "pending",
    safety_status: "pending",
    permit_approver_status: "pending",
    rejection_reason: null,
    valid_from: payload.valid_from ?? null,
    valid_to: payload.valid_to ?? null
  };

  const { data, error } = await supabaseAdmin
    .from("permits_to_work")
    .insert(insertPayload)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  await insertNotification(
    data.id,
    "permit_created",
    "area_manager",
    `تم إنشاء التصريح ${data.permit_no} وهو بانتظار مراجعة مديرة المنطقة.`,
    user.id
  );

  return data as PermitWorkflowRow;
}

export async function openPermitToWork(user: AuthenticatedUser, permitId: string) {
  const { data, error } = await supabaseAdmin
    .from("permits_to_work")
    .update({
      opened_at: new Date().toISOString(),
      opened_by: user.id
    })
    .eq("id", permitId)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  const currentRecipient = data.current_step === "completed" ? "requester" : data.current_step;
  await insertNotification(
    data.id,
    "permit_opened",
    currentRecipient,
    `تم فتح التصريح ${data.permit_no} للمراجعة.`,
    user.id
  );

  return data as PermitWorkflowRow;
}

export async function decidePermitToWork(
  user: AuthenticatedUser,
  permitId: string,
  decision: DecisionAction,
  comment?: string
) {
  const { data: permit, error: selectError } = await supabaseAdmin
    .from("permits_to_work")
    .select("*")
    .eq("id", permitId)
    .single();

  if (selectError || !permit) {
    throw selectError || new Error("تعذر العثور على التصريح");
  }

  const permitRow = permit as PermitWorkflowRow;
  ensurePermitDecisionAccess(user, permitRow);

  const step = permitRow.current_step as WorkflowStep;
  const stepColumn = `${step}_status`;

  if (decision === "reject") {
    const { data, error } = await supabaseAdmin
      .from("permits_to_work")
      .update({
        [stepColumn]: "rejected",
        status: "rejected",
        current_step: "requester",
        rejection_reason: comment || "تم رفض التصريح"
      })
      .eq("id", permitId)
      .select("*")
      .single();

    if (error) {
      throw error;
    }

    await insertNotification(
      permitId,
      "permit_rejected",
      "permit_requester",
      `تم رفض التصريح ${permitRow.permit_no} من ${stepLabels[step]}.`,
      user.id
    );

    return data as PermitWorkflowRow;
  }

  const nextStep = getNextStep(step);
  const updatePayload: Record<string, string | null> = {
    [stepColumn]: "approved",
    rejection_reason: null
  };

  if (nextStep) {
    updatePayload.current_step = nextStep;
    updatePayload.status = "in_review";
  } else {
    updatePayload.current_step = "completed";
    updatePayload.status = "approved";
    updatePayload.approved_by = user.id;
    updatePayload.final_approved_at = new Date().toISOString();
  }

  const { data, error } = await supabaseAdmin
    .from("permits_to_work")
    .update(updatePayload)
    .eq("id", permitId)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  if (nextStep) {
    await insertNotification(
      permitId,
      "permit_forwarded",
      nextStep,
      `التصريح ${permitRow.permit_no} بانتظار اعتماد ${stepLabels[nextStep]}.`,
      user.id
    );
  } else {
    await insertNotification(
      permitId,
      "permit_approved",
      "permit_requester",
      `تم اعتماد التصريح ${permitRow.permit_no} نهائياً وأصبح جاهزاً للتصدير.`,
      user.id
    );
  }

  return data as PermitWorkflowRow;
}

export async function closePermitToWork(user: AuthenticatedUser, permitId: string) {
  const { data, error } = await supabaseAdmin
    .from("permits_to_work")
    .update({
      status: "closed"
    })
    .eq("id", permitId)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  await insertNotification(
    permitId,
    "permit_closed",
    "permit_requester",
    `تم إغلاق التصريح ${data.permit_no}.`,
    user.id
  );

  return data as PermitWorkflowRow;
}

export async function exportPermitToWork(user: AuthenticatedUser, permitId: string) {
  const { data, error } = await supabaseAdmin
    .from("permits_to_work")
    .select("*")
    .eq("id", permitId)
    .single();

  if (error || !data) {
    throw error || new Error("تعذر العثور على التصريح");
  }

  const permit = data as PermitWorkflowRow;
  if (!["approved", "closed"].includes(permit.status)) {
    throw new Error("لا يمكن تصدير التصريح قبل اكتمال الاعتماد");
  }

  await supabaseAdmin
    .from("permits_to_work")
    .update({
      exported_at: new Date().toISOString()
    })
    .eq("id", permitId);

  await insertNotification(
    permitId,
    "permit_exported",
    "permit_requester",
    `تم تصدير التصريح ${permit.permit_no}.`,
    user.id
  );

  const lines = [
    "permit_no,work_type,area,status,current_step,valid_from,valid_to,contractor_name",
    [
      permit.permit_no,
      permit.work_type,
      permit.area || "",
      permit.status,
      permit.current_step,
      permit.valid_from || "",
      permit.valid_to || "",
      permit.contractor_name || ""
    ]
      .map((value) => `"${String(value).replaceAll("\"", "\"\"")}"`)
      .join(",")
  ];

  return {
    filename: `${permit.permit_no}.csv`,
    content: lines.join("\n")
  };
}

export async function listPermitNotifications(permitId: string) {
  const { data, error } = await supabaseAdmin
    .from("permit_notifications")
    .select("*")
    .eq("permit_id", permitId)
    .order("created_at", { ascending: false })
    .limit(25);

  if (error) {
    throw error;
  }

  return (data || []) as PermitNotificationRow[];
}
