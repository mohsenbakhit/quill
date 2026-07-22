import { useState, useEffect } from "react";
import { FileMenu } from "./FileMenu";
import { ExportMenu } from "./ExportMenu";


export function Toolbar() {
  return (
    <div className="heading">
      <h1 id="title" >Quill</h1>
      <div>
        <FileMenu />
        <ExportMenu />

      </div>
    </div>
  )
}
