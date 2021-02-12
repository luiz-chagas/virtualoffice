import { andThen, equals, pipe, tap } from "ramda";
import { FunctionComponent, useEffect, useState } from "react";
import {
  Button,
  RadioButton,
  Typography,
  Window,
  Checkbox,
} from "react-windows-xp";
import { useFirebase } from "../../hooks/useFirebase";
import { load, save } from "../../utils/localStorage";
import Char1 from "./images/Char1.png";
import Char2 from "./images/Char2.png";
import Char3 from "./images/Char3.png";
import Char4 from "./images/Char4.png";

interface Props {
  onClose: () => void;
  onSignOut: () => void;
}

export const SettingsApp: FunctionComponent<Props> = ({
  onClose,
  onSignOut,
}) => {
  const { signOut, user } = useFirebase();

  const [selectedCharacter, setSelectedCharacter] = useState(
    load("char") ?? "player1"
  );

  const [playWindowsSound, setPlayWindowsSound] = useState(
    Boolean(load("playSound") ?? "true")
  );

  useEffect(() => {
    if (!user) {
      onSignOut();
    }
  }, [onSignOut, user]);

  const saveSettings = pipe(
    () => save("playSound", playWindowsSound),
    () => save("char", selectedCharacter),
    onClose
  );

  return (
    <Window title="Settings" width="auto" showClose onClose={onClose}>
      <Typography variant="h5">Account</Typography>
      <Button onClick={signOut}>Sign Out</Button>
      <Typography variant="h5">System</Typography>
      <Checkbox
        label="Play logon sound after signing in"
        id="logon"
        onChange={setPlayWindowsSound}
        checked={playWindowsSound}
      />
      <Typography variant="h5">Appearance</Typography>
      <div style={{ display: "flex" }}>
        <OptionContainer>
          <RadioButton
            onClick={() => setSelectedCharacter("player1")}
            group="char"
            id="player1"
            label="Character 1"
            defaultChecked={equals(selectedCharacter, "player1")}
          />
          <img src={Char1} style={{ maxWidth: "64px" }} alt="Character 1" />
        </OptionContainer>
        <OptionContainer>
          <RadioButton
            onClick={() => setSelectedCharacter("player2")}
            group="char"
            id="player2"
            label="Character 2"
            defaultChecked={equals(selectedCharacter, "player2")}
          />
          <img src={Char2} style={{ maxWidth: "64px" }} alt="Character 2" />
        </OptionContainer>
        <OptionContainer>
          <RadioButton
            onClick={() => setSelectedCharacter("player3")}
            group="char"
            id="player3"
            label="Character 3"
            defaultChecked={equals(selectedCharacter, "player3")}
          />
          <img src={Char3} style={{ maxWidth: "64px" }} alt="Character 3" />
        </OptionContainer>
        <OptionContainer>
          <RadioButton
            onClick={() => setSelectedCharacter("player4")}
            group="char"
            id="player4"
            label="Character 4"
            defaultChecked={equals(selectedCharacter, "player4")}
          />
          <img src={Char4} style={{ maxWidth: "64px" }} alt="Character 4" />
        </OptionContainer>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <Button onClick={saveSettings}>Save</Button>
      </div>
    </Window>
  );
};

const OptionContainer: React.FunctionComponent = ({ children }) => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        margin: "10px",
        alignItems: "center",
      }}
    >
      {children}
    </div>
  );
};
