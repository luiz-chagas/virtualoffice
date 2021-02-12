import { FunctionComponent } from "react";
import { Typography } from "react-windows-xp";
import styles from "./Shortcut.module.css";

interface Props {
  name: string;
  onClick: () => void;
  icon: string;
}

export const Shortcut: FunctionComponent<Props> = ({ name, icon, onClick }) => (
  <div style={{ maxWidth: "64px", margin: "10px" }}>
    <button
      onClick={onClick}
      style={{
        border: "none",
        boxShadow: "none",
        cursor: "pointer",
      }}
      className={styles.btnShortcut}
    >
      <img style={{ maxWidth: "100%" }} src={icon} alt={name} />
      <Typography variant="span">
        <span style={{ color: "white" }}>{name}</span>
      </Typography>
    </button>
  </div>
);
