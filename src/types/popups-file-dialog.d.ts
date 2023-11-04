declare module "popups-file-dialog" {
  export interface FileDialogOptions {
    /**
     * The title of the popup.
     * @default "save"
     */
    title: string,
    /**
     * The start path of the popup and the `savedFile` name.
     * @default "./default.txt"
     */
    startPath: string,
    /**
     * The filter patterns of the popup
     * @default ["*"]
     */
    filterPatterns: string[],
    /**
     * The filter patterns description of the popup
     * @default ""
     */
    filterPatternsDescription: string,
  }
  /**
   * Save file with dialog.
   * @param opts Options
   * @returns Path of selected file to export.
   */
  export async function saveFile(
    opts: FileDialogOptions
  ): Promise<string>
  /**
   * Open directory with dialog.
   * @param opts Options
   * @returns Path of selected directory
   * @throws {Error} if user hasn't been selected.
   */
  export async function openDirectory(
    opts: { title: string },
  ): Promise<string>

  /**
   * Open file(s) with dialog.
   * @param opts Options
   * @returns Path of selected file(s)
   */
  export async function openFile(
    opts: FileDialogOptions & {
      allowMultipleSelects?: boolean,
    }
  ): Promise<string[]>
}