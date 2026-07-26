import { FileMenu } from "./FileMenu";
import { ExportMenu } from "./ExportMenu";
import { FileMenuProps } from "../utils/interfaces";
import { usePagination } from "../hooks/usePagination";


export function Toolbar({ editor, isDirty, setIsDirty }: FileMenuProps) {
  const { pageCount, currentPage } = usePagination(editor)

  return (
    <div className="heading">
      <h1 id="title" >Quill</h1>
      <div>
        <FileMenu editor={editor} isDirty={isDirty} setIsDirty={setIsDirty}/>
        <ExportMenu editor={editor} isDirty={isDirty} setIsDirty={setIsDirty}/>
        <div className="status-bar">
          Page {currentPage} of {pageCount}
        </div>
      </div>
    </div>
  )
}
