import React, { useEffect, useState } from "react";
import { Window, TextBox, Button } from "react-windows-xp";

function App() {
  const [name, setName] = useState("");
  const [showPhaser, setShowPhaser] = useState(false);

  useEffect(() => {
    const name = localStorage.getItem("name");
    if (name) {
      setName(name);
    }
  }, []);

  if (showPhaser) {
    return (
      <div
        style={{
          position: "absolute",
          height: "100%",
          width: "100%",
          top: 0,
          left: 0,
        }}
      >
        <iframe
          width="100%"
          height="100%"
          style={{
            border: "none",
          }}
          title="Crema Virtual Office"
          src={`/phaser?name=${name}&date=${Date.now()}`}
        />
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexGrow: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#3A6EA5",
      }}
    >
      <div
        style={{
          maxWidth: 400,
        }}
      >
        <Window
          title="Connect to Crema"
          showClose
          onClose={() => {
            window.location.href =
              "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
          }}
        >
          <div style={{ padding: "8px" }}>
            <TextBox
              label="Who are you?"
              stacked
              id="cremaname"
              placeholder="Your Name Goes Here"
              value={name}
              onChange={(newName) => {
                if (newName.length < 13) {
                  setName(newName);
                }
              }}
            />
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                paddingTop: "16px",
              }}
            >
              <Button
                onClick={() => {
                  setShowPhaser(true);
                  localStorage.setItem("name", name);
                }}
                disabled={name.length === 0}
              >
                Join Loft
              </Button>
            </div>
          </div>
        </Window>
      </div>
    </div>
  );
}

export default App;
