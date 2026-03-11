import type { Doc } from "../../convex/_generated/dataModel";

interface TodayOverview {
  profile: Doc<"patientProfiles"> | null;
  todayTasks: Doc<"treatmentTasks">[];
  nextAppointment: Doc<"appointments"> | null;
}

export function StatusPanel({
  data,
  onClose,
}: {
  data: TodayOverview | undefined;
  onClose?: () => void;
}) {
  if (!data) {
    return (
      <div className="flex h-full items-center justify-center bg-white p-4">
        <p className="text-sm text-gray-400">Loading...</p>
      </div>
    );
  }

  const { profile, todayTasks, nextAppointment } = data;
  const doneTasks = todayTasks.filter((t) => t.status === "done");
  const pendingTasks = todayTasks.filter((t) => t.status === "pending");

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-white">
      {/* Header with close button on mobile */}
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
          Dashboard
        </span>
        {onClose && (
          <button
            onClick={onClose}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 md:hidden"
            aria-label="Close panel"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Cycle Day Badge */}
      {profile && (
        <div className="border-b border-gray-100 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-purple px-3 py-1 text-sm font-bold text-white">
              Day {profile.cycleDay}
            </span>
            <span className="text-xs text-gray-500">{profile.protocol}</span>
          </div>
          <p className="mt-1 text-xs text-gray-400">
            {profile.name} &middot; {profile.clinicName}
          </p>
        </div>
      )}

      {/* Today's Tasks */}
      <div className="border-b border-gray-100 px-4 py-3">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
          Today's Tasks
        </h3>
        {todayTasks.length === 0 ? (
          <p className="text-xs text-gray-400">No tasks for today</p>
        ) : (
          <ul className="space-y-1.5">
            {[...pendingTasks, ...doneTasks].map((task) => (
              <li key={task._id} className="flex items-start gap-2">
                {task.status === "done" ? (
                  <svg className="mt-0.5 h-4 w-4 shrink-0 text-teal" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : task.status === "skipped" ? (
                  <svg className="mt-0.5 h-4 w-4 shrink-0 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="mt-0.5 h-4 w-4 shrink-0 text-coral" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="9" strokeWidth="2" />
                  </svg>
                )}
                <span
                  className={`text-xs leading-snug ${
                    task.status === "done"
                      ? "text-gray-400 line-through"
                      : "text-gray-700"
                  }`}
                >
                  {task.title}
                  {task.scheduledTime && (
                    <span className="ml-1 text-gray-400">
                      {task.scheduledTime}
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-2 text-xs text-gray-400">
          {doneTasks.length}/{todayTasks.length} completed
        </p>
      </div>

      {/* Next Appointment */}
      {nextAppointment && (
        <div className="border-b border-gray-100 px-4 py-3">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
            Next Appointment
          </h3>
          <div className="rounded-lg border border-purple-light/30 bg-purple/5 p-2.5">
            <p className="text-xs font-medium text-purple">
              {nextAppointment.title}
            </p>
            <p className="mt-0.5 text-xs text-gray-500">
              {new Date(nextAppointment.dateTime).toLocaleDateString(undefined, {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}{" "}
              at{" "}
              {new Date(nextAppointment.dateTime).toLocaleTimeString(undefined, {
                hour: "numeric",
                minute: "2-digit",
              })}
            </p>
            {nextAppointment.location && (
              <p className="mt-0.5 text-xs text-gray-400">
                {nextAppointment.location}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
