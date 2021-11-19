import { FunctionComponent, useState } from "react";
import { Button, Window, TextBox } from "react-windows-xp";
import { Socket } from "socket.io-client";

interface Props {
  socket: Socket;
  onClose: () => void;
}

export const NewOffice: FunctionComponent<Props> = ({ onClose, socket }) => {
  const [isCreatingOffice, setIsCreatingOffice] = useState(false);
  const [officeName, setOfficeName] = useState("");

  const handleCreateOffice = () => {
    socket.emit("createWorld", { name: officeName });
    setIsCreatingOffice(true);
    setTimeout(() => {
      onClose();
    }, 700);
  };

  return (
    <Window title="Create Office" showClose onClose={onClose}>
      <div style={{ margin: "16px 0px", minWidth: "180px" }}>
        <TextBox
          id="office-name"
          placeholder="New Name"
          style={{ display: "flex", flexGrow: 1 }}
          onChange={(text) => {
            setOfficeName(text);
          }}
        />
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <Button onClick={handleCreateOffice} disabled={isCreatingOffice}>
          Create Office
        </Button>
      </div>
    </Window>
  );
};
