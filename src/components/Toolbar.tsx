import { FileMenu } from "./FileMenu";
import { ExportMenu } from "./ExportMenu";
import { FileMenuProps } from "../utils/interfaces";
import { usePagination } from "../hooks/usePagination";
import { NodeTypeBar } from "./NodeTypeBar";


export function Toolbar({ editor, isDirty, setIsDirty }: FileMenuProps) {
  const { pageCount, currentPage } = usePagination(editor)

  return (
    <div className="heading">
      <h1 id="title" >Quill</h1>
      <div className="toolbar-controls">
        <NodeTypeBar editor={editor}>
          <div className="toolbar-menu-group">
            <FileMenu editor={editor} isDirty={isDirty} setIsDirty={setIsDirty}/>
            <ExportMenu editor={editor} isDirty={isDirty} setIsDirty={setIsDirty}/>
          </div>
          <div className="toolbar-divider" aria-hidden="true" />
        </NodeTypeBar>
        <div className="status-bar">
          Page {currentPage} of {pageCount}
        </div>
      </div>
    </div>
  )
}
