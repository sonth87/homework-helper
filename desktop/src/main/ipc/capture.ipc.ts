import { ipcMain } from 'electron';
import { captureDisplay, cropToBase64 } from '../acquisition/capture/screen-capture';
import { displayById, displayUnderCursor, selectionToImageRect } from '../acquisition/capture/display';
import { selectRegion } from '../windows/region-select.window';
import { rect, raw } from '@shared/types/geometry';

/**
 * Cho phép renderer chủ động yêu cầu khoanh vùng — dùng khi người dùng bấm nút
 * "chụp lại" trong cửa sổ kết quả, thay vì phải bấm phím tắt lần nữa.
 */
export function registerCaptureIpc(): void {
  ipcMain.handle('capture:region', async () => {
    const selection = await selectRegion(displayUnderCursor());
    if (!selection) return null;

    const display = displayById(selection.displayId);
    const image = await captureDisplay(display);
    const region = selectionToImageRect(selection.region, display);
    const s = display.scaleFactor;

    return {
      imageBase64: cropToBase64(image, region),
      area: raw(rect('screen-physical', {
        x: Math.round(selection.region.x * s),
        y: Math.round(selection.region.y * s),
        width: Math.round(selection.region.width * s),
        height: Math.round(selection.region.height * s),
      })),
      displayId: display.id,
      scaleFactor: s,
    };
  });
}
