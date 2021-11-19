import { Window, Button } from "react-windows-xp";
import Draggable from "react-draggable";
import { useFirebase } from "../../hooks/useFirebase";
import firebase from "firebase/app";
import { FunctionComponent, useEffect, useRef } from "react";
import Logo from "./logo.png";
import Crema from "./crema.png";
import { load, save } from "../../utils/localStorage";

interface Props {
  onUserSignedIn: (user: firebase.User) => void;
}

export const SignIn: FunctionComponent<Props> = ({ onUserSignedIn }) => {
  const playAudio = Boolean(load("playSound") ?? "true");

  const { user, signIn } = useFirebase();
  const ref = useRef(null);

  useEffect(() => {
    if (user) {
      save("uid", user.uid);
      if (playAudio) {
        new Audio("/logon.mp3").play();
      }
      onUserSignedIn(user);
    }
  }, [onUserSignedIn, user, playAudio]);

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
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginTop: "8px",
              marginBottom: "8px",
            }}
          >
            <Button onClick={signIn}>Connect</Button>
          </div>
        </Window>
      </div>
    </Draggable>
  );
};
