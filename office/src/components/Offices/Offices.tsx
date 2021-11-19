import { map, values } from "ramda";
import { FunctionComponent, useEffect, useState } from "react";
import Draggable from "react-draggable";
import { Button, RadioButton, Typography, Window } from "react-windows-xp";
import { io, Socket } from "socket.io-client";
import { save } from "../../utils/localStorage";
import { NewOffice } from "./NewOffice";

interface Props {
  onClose: () => void;
  onJoin: () => void;
}

interface Office {
  id: string;
  name: string;
  players: string[];
}

const disabledStyles: React.HTMLAttributes<HTMLDivElement>["style"] = {
  pointerEvents: "none",
  opacity: 0.5,
};

export const OfficesApp: FunctionComponent<Props> = ({ onClose, onJoin }) => {
  const [socket, setSocket] = useState<Socket>();
  const [offices, setOffices] = useState<Office[]>();
  const [selectedOffice, setSelectedOffice] = useState<Office>();
  const [showCreateNew, setShowCreateNew] = useState(false);

  useEffect(() => {
    const socket =
      process.env.NODE_ENV === "development"
        ? io("localhost:8080", {
            transports: ["websocket"],
          })
        : io({
            transports: ["websocket"],
          });

    socket.on("worlds", (data: Record<string, Office>) => {
      setOffices(values(data));
    });
    setSocket(socket);
    return () => {
      socket.close();
    };
  }, []);

  const handleConnect = () => {
    save("world", selectedOffice?.id ?? "");
    onJoin();
  };

  return (
    <>
      <Window
        title="Virtual Offices"
        showClose
        onClose={onClose}
        style={showCreateNew ? disabledStyles : {}}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: "16px",
          }}
        >
          <Typography variant="span">Online Offices</Typography>
          <Button onClick={() => setShowCreateNew(true)}>Create New</Button>
        </div>
        <div
          style={{
            width: "500px",
            backgroundColor: "white",
            margin: "8px 0px",
          }}
        >
          {map(
            (office) => (
              <div key={office.id} style={{ padding: "8px" }}>
                <RadioButton
                  onClick={() => setSelectedOffice(office)}
                  group="office"
                  id={office.id}
                  label={`[ONLINE] ${office.name} => Online: ${office.players.length}`}
                />
              </div>
            ),
            offices || []
          )}
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <Button disabled={!selectedOffice} onClick={handleConnect}>
            Connect
          </Button>
        </div>
      </Window>
      {showCreateNew && socket && (
        <Draggable>
          <div style={{ position: "absolute", top: "10%", left: "30%" }}>
            <NewOffice
              socket={socket}
              onClose={() => {
                setShowCreateNew(false);
              }}
            />
          </div>
        </Draggable>
      )}
    </>
  );
};
