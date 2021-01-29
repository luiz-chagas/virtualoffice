import { Dropdown, Window, Typography, Button } from "react-windows-xp";
import Draggable from "react-draggable";
import { useFirebase } from "../../hooks/useFirebase";
import firebase from "firebase/app";
import { FunctionComponent, useEffect, useRef, useState } from "react";
import Logo from "./logo.png";
import Crema from "./crema.png";
import { pipe } from "ramda";

interface Props {
  onUserSignedIn: (user: firebase.User) => void;
}

export const SignIn: FunctionComponent<Props> = ({ onUserSignedIn }) => {
  const [state, setState] = useState<"NORMAL" | "ERROR">("NORMAL");
  const [playAudio, setPlayAudio] = useState(false);

  const { user, signIn, signOut } = useFirebase();
  const ref = useRef(null);

  useEffect(() => {
    if (user) {
      if (/@crema.us/.test(user.email ?? "")) {
        if (playAudio) {
          // new Audio("/logon.mp3").play();
        }
        onUserSignedIn(user);
      } else {
        setState("ERROR");
        signOut();
      }
    }
  }, [onUserSignedIn, user, signOut, playAudio]);

  const handleSignIn = pipe(
    () => setPlayAudio(true),
    () => setState("NORMAL"),
    signIn
  );

  return (
    <Draggable nodeRef={ref}>
      <div ref={ref} style={{ maxWidth: "50%" }}>
        <Window title="Log On to Crema" showClose width="400px">
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
            <Button onClick={handleSignIn}>Ok</Button>
          </div>
        </Window>
      </div>
    </Draggable>
  );
};
