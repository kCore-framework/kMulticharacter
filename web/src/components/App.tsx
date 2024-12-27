import React from "react";
import { debugData } from "../utils/debugData";
import CharacterMenu from "./Menu";
debugData([
  {
    action: "setVisible",
    data: true,
  },
]);


const App: React.FC = () => {
  return (
    <div className="nui-wrapper">
       <CharacterMenu/>
    </div>
  );
};

export default App;
