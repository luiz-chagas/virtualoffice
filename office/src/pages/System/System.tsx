import { Wallpaper } from "react-windows-xp";
import { Shortcut } from "../../components/Shortcut";
import Preferences from "./icons/preferences.png";
import Users from "./icons/users.png";
import World from "./icons/world.png";
import { ErrorAlert } from "../../components/Error";
import Draggable from "react-draggable";
import { FunctionComponent, useState } from "react";
import { SettingsApp } from "../../components/Settings";
import { OfficesApp } from "../../components/Offices";

interface Props {
  onJoin: () => void;
  onSignOut: () => void;
}

export const System: FunctionComponent<Props> = ({ onJoin, onSignOut }) => {
  const [hasError, setHasError] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showOffices, setShowOffices] = useState(false);

  return (
    <Wallpaper fullScreen>
      <div
        style={{ padding: "10px", display: "flex", flexDirection: "column" }}
      >
        <Shortcut
          icon={Preferences}
          onClick={() => setShowSettings(true)}
          name="Settings"
        />
        {/* <Shortcut icon={Terminal} onClick={onJoin} name="Crema" /> */}
        <Shortcut
          icon={World}
          onClick={() => {
            setShowOffices(true);
          }}
          name="Virtual Offices"
        />
        {/* <Shortcut icon={Preferences} onClick={() => void 0} name="Ranking" /> */}
        <Shortcut
          icon={Users}
          onClick={() => setHasError(true)}
          name="Guests"
        />
      </div>
      {hasError && (
        <Draggable>
          <div style={{ position: "absolute", top: "40%", left: "40%" }}>
            <ErrorAlert onAccept={() => setHasError(false)} />
          </div>
        </Draggable>
      )}
      {showSettings && (
        <div style={{ position: "absolute", top: "30%", left: "40%" }}>
          <SettingsApp
            onClose={() => setShowSettings(false)}
            onSignOut={onSignOut}
          />
        </div>
      )}
      {showOffices && (
        <div style={{ position: "absolute", top: "30%", left: "30%" }}>
          <OfficesApp onClose={() => setShowOffices(false)} onJoin={onJoin} />
        </div>
      )}
    </Wallpaper>
  );
};
