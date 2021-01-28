import { Dropdown, Window, Typography, Button } from "react-windows-xp";
import Draggable from "react-draggable";
import { useFirebase } from "../../hooks/useFirebase";
import firebase from "firebase/app";
import { FunctionComponent, useEffect, useRef, useState } from "react";

interface Props {
  onUserSignedIn: (user: firebase.User) => void;
}

export const SignIn: FunctionComponent<Props> = ({ onUserSignedIn }) => {
  const [state, setState] = useState<"NORMAL" | "ERROR">("NORMAL");

  const { user, signIn, signOut } = useFirebase();
  const ref = useRef(null);

  useEffect(() => {
    if (user) {
      if (/@crema.us/.test(user.email ?? "")) {
        onUserSignedIn(user);
      } else {
        setState("ERROR");
        signOut();
      }
    }
  }, [onUserSignedIn, user, signOut]);

  return (
    <Draggable nodeRef={ref}>
      <div ref={ref} style={{ maxWidth: "50%" }}>
        <Window title="Log On to Crema" showClose width="400px">
          <div
            style={{
              backgroundColor: "#1e1b29",
              height: 100,
            }}
          ></div>
          <div
            style={{
              marginTop: 8,
              marginBottom: 8,
            }}
          >
            <div style={{ display: "inline-block", marginRight: 16 }}>
              <Typography variant="span" alignment="left">
                Connect To
              </Typography>
            </div>
            <Dropdown value="crema" onChange={function () {}}>
              <Dropdown.Option id="crema">Crema Loft</Dropdown.Option>
            </Dropdown>
          </div>
          <div style={{ color: "red" }}>
            <Typography variant="span" alignment="left">
              {state === "ERROR"
                ? "Unauthorized Email. Please use your Crema email."
                : ""}
            </Typography>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginBottom: 8,
            }}
          >
            <Button
              onClick={() => {
                setState("NORMAL");
                signIn();
              }}
            >
              Ok
            </Button>
          </div>
        </Window>
      </div>
    </Draggable>
  );
};
