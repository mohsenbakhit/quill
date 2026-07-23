import { FileMenu } from "./FileMenu";
import { ExportMenu } from "./ExportMenu";
import { FileMenuProps } from "../utils/interfaces";


export function Toolbar({ editor, isDirty, setIsDirty }: FileMenuProps) {
  return (
    <div className="heading">
      <h1 id="title" >Quill</h1>
      <div>
        <FileMenu editor={editor} isDirty={isDirty} setIsDirty={setIsDirty}/>
        <ExportMenu />

      </div>
    </div>
  )
}
