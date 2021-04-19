import { Window, Typography, Button } from "react-windows-xp";
import Draggable from "react-draggable";
import { useFirebase } from "../../hooks/useFirebase";
import firebase from "firebase/app";
import { FunctionComponent, useEffect, useRef, useState } from "react";
import Logo from "./logo.png";
import Crema from "./crema.png";
import { pipe } from "ramda";
import { load, save } from "../../utils/localStorage";

interface Props {
  onUserSignedIn: (user: firebase.User) => void;
}

export const SignIn: FunctionComponent<Props> = ({ onUserSignedIn }) => {
  const [state, setState] = useState<"NORMAL" | "ERROR">("NORMAL");
  const playAudio = Boolean(load("playSound") ?? "true");

  const { user, signIn, signOut } = useFirebase();
  const ref = useRef(null);

  useEffect(() => {
    if (user) {
      save("uid", user.uid);
      if (/@crema.us/.test(user.email ?? "")) {
        if (playAudio) {
          new Audio("/logon.mp3").play();
        }
        onUserSignedIn(user);
      } else {
        setState("ERROR");
        signOut();
      }
    }
  }, [onUserSignedIn, user, signOut, playAudio]);

  const handleSignIn = pipe(() => setState("NORMAL"), signIn);

  return (
    <Draggable nodeRef={ref}>
      <div ref={ref} style={{ maxWidth: "50%" }}>
        <Window title="Log On to Crema" showClose style={{ width: "400px" }}>
          <div
            style={{
              backgroundColor: "#1e1b29",
              height: 100,
              display: "flex",
              alignItems: "center",
            }}
          >
            <img
              style={{ marginLeft: 16, height: 80 }}
              src={Logo}
              alt="Crema Logo"
            />
            <img
              style={{ marginLeft: 16, height: 60 }}
              src={Crema}
              alt="Crema"
            />
          </div>
          <div style={{ color: "red" }}>
            <Typography variant="span">
              {state === "ERROR"
                ? "Unauthorized Email. Please use your Crema email."
                : ""}
            </Typography>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginTop: "8px",
              marginBottom: "8px",
            }}
          >
            <Button onClick={handleSignIn}>Connect</Button>
          </div>
        </Window>
      </div>
    </Draggable>
  );
};
