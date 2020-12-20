import React, { useState } from "react";
import { Wallpaper, Window, TextBox, Button } from "react-windows-xp";

function App() {
  const [name, setName] = useState("");
  const [showPhaser, setShowPhaser] = useState(false);

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
          src={`/phaser?name=${name}`}
        />
      </div>
    );
  }

  return (
    <Wallpaper fullScreen>
      <div
        style={{
          display: "flex",
          height: "100%",
          alignItems: "center",
          justifyContent: "center",
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
                  onClick={() => setShowPhaser(true)}
                  disabled={name.length === 0}
                >
                  Join Loft
                </Button>
              </div>
            </div>
          </Window>
        </div>
      </div>
    </Wallpaper>
  );
}

export default App;
