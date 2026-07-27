import {
  Avatar,
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  StatusDot,
} from "@/shared/ui";

type Participant = { id: string; name: string };
type WarRoomAction = { id: string; title: string };

type WarRoomProps = {
  participants: readonly Participant[];
  actions: readonly WarRoomAction[];
  onUndo: () => void;
};

export function WarRoom({ participants, actions, onUndo }: WarRoomProps) {
  return (
    <Card as="section">
      <CardHeader>
        <CardTitle>War room</CardTitle>
        <span className="text-text-3 ml-auto flex items-center gap-1.5 text-[11px] font-medium">
          <StatusDot tone="success" pulse />
          live
        </span>
      </CardHeader>
      <CardBody>
        <div className="mb-3 flex items-center gap-2.5">
          <div className="flex -space-x-2">
            {participants.slice(0, 6).map((p) => (
              <Avatar
                key={p.id}
                name={p.name}
                size={24}
                className="ring-surface ring-2"
              />
            ))}
          </div>
          <span className="text-text-3 text-[11.5px]">
            {participants.length} in the room
          </span>
        </div>

        {actions.length === 0 ? (
          <p className="text-text-3 text-[12px]">
            No actions taken yet. Executed remediations appear here.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {actions.map((a, i) => (
              <li key={a.id} className="flex items-center gap-2 text-[12px]">
                <StatusDot tone="info" />
                <span className="text-text-2 min-w-0 flex-1 truncate">
                  {a.title}
                </span>
                {i === actions.length - 1 ? (
                  <Button size="sm" variant="ghost" onClick={onUndo}>
                    Undo
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}
