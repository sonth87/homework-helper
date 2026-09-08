/**
 * Chụp màn hình qua desktopCapturer.
 *
 * Điểm dễ sai nhất: `thumbnailSize` phải là PIXEL VẬT LÝ. Truyền kích thước
 * logic vào thì trên máy Retina sẽ nhận ảnh chỉ bằng nửa độ phân giải thật —
 * OCR và mô hình thị giác đọc chữ nhỏ sẽ kém hẳn, mà nhìn qua thì ảnh vẫn
 * "trông đúng".
 */

import { desktopCapturer } from 'electron';
import type { NativeImage } from 'electron';
import type { Rect } from '@shared/types/geometry';
import { raw } from '@shared/types/geometry';
import type { DisplayInfo } from './display';
import { logger } from '../../logging/logger';

export async function captureDisplay(display: DisplayInfo): Promise<NativeImage> {
  const sources = await desktopCapturer.getSources({
    types: ['screen'],
    thumbnailSize: {
      width: display.boundsPhysical.width,
      height: display.boundsPhysical.height,
    },
    fetchWindowIcons: false,
  });

  // display_id là chuỗi trong desktopCapturer nhưng số trong screen API.
  const match = sources.find((s) => s.display_id === String(display.id)) ?? sources[0];
  if (!match) throw new Error('Không lấy được nguồn màn hình. Kiểm tra quyền ghi màn hình.');

  const image = match.thumbnail;
  if (image.isEmpty()) {
    throw new Error('Ảnh chụp rỗng — thường là do chưa cấp quyền Ghi màn hình.');
  }

  const size = image.getSize();
  if (size.width !== display.boundsPhysical.width) {
    // Không phải lỗi chặn, nhưng đáng ghi lại: hệ điều hành đã co ảnh, nên tỉ
    // lệ crop bên dưới phải theo kích thước thật chứ không theo kích thước yêu cầu.
    logger.warn('Kích thước ảnh khác yêu cầu', { asked: display.boundsPhysical.width, got: size.width });
  }

  return image;
}

/** Cắt ảnh theo vùng đã chọn, trả về base64 PNG không kèm tiền tố data URL. */
export function cropToBase64(image: NativeImage, region: Rect<'image'>): string {
  const size = image.getSize();
  const r = raw(region);

  // Ghim vào trong ảnh: kéo chọn tràn mép màn hình sẽ cho toạ độ âm hoặc vượt biên.
  const x = Math.max(0, Math.min(r.x, size.width - 1));
  const y = Math.max(0, Math.min(r.y, size.height - 1));
  const width = Math.max(1, Math.min(r.width, size.width - x));
  const height = Math.max(1, Math.min(r.height, size.height - y));

  return image.crop({ x, y, width, height }).toPNG().toString('base64');
}
