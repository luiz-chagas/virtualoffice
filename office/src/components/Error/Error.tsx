import { FunctionComponent } from "react";
import { Button, Typography, Window } from "react-windows-xp";
import ErrorIcon from "./icons/error.png";

interface Props {
  onAccept: () => void;
}

export const ErrorAlert: FunctionComponent<Props> = ({ onAccept }) => {
  return (
    <Window title="Error" width="200px" showClose onClose={onAccept}>
      <div style={{ display: "flex", alignItems: "center" }}>
        <img src={ErrorIcon} style={{ maxWidth: "48px" }} alt="Error" />
        <Typography variant="paragraph">
          Error: Application not found
        </Typography>
      </div>
      <div style={{ display: "flex", justifyContent: "center" }}>
        <Button onClick={onAccept}>Ok</Button>
      </div>
    </Window>
  );
};
