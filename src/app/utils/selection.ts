
import { FloorPlanElement, Point } from '../types/floorplan';
import { isPointInRect, isPointNearLine, isPointNearPath } from './geometry';

export function findElementAtPoint(
    point: Point,
    elements: FloorPlanElement[],
    panOffset: Point,
    zoom: number = 1
): FloorPlanElement | null {
    //! Stacking order is from start, so reverse to get the top element first.
    // return elements.find((el) => isElementAtPoint(el, point, panOffset, zoom)) || null;
    return elements.reverse().find((el) => isElementAtPoint(el, point, panOffset, zoom)) || null;
}

export function isElementAtPoint(
    element: FloorPlanElement,
    point: Point,
    panOffset: Point,
    zoom: number = 1
): boolean {
    if (element.type === 'room') {
        return isPointInRect(point, {
            x: element.x * zoom + panOffset.x,
            y: element.y * zoom + panOffset.y,
            width: element.width * zoom,
            height: element.height * zoom,
        });
    } else if (element.type === 'wall') {
        const x1 = element.x1 * zoom + panOffset.x;
        const y1 = element.y1 * zoom + panOffset.y;
        const x2 = element.x2 * zoom + panOffset.x;
        const y2 = element.y2 * zoom + panOffset.y;

        return isPointNearLine(
            point,
            { x: x1, y: y1 },
            { x: x2, y: y2 },
            element.thickness / 2 + 5
        );
    } else if (element.type === 'pencil') {
        const offsetPoints = element.points.map((p) => ({
            x: p.x * zoom + panOffset.x,
            y: p.y * zoom + panOffset.y,
        }));

        return isPointNearPath(point, offsetPoints, element.lineWidth + 5);
    } else if (element.type === 'text') {
        // Text block selection
        const fontSize = (element.fontSize || 16) * zoom;
        const text = element.text || 'Text';
        // Approximate text width (more accurate measurement would require canvas context)
        const textWidth = text.length * fontSize * 0.6;

        return isPointInRect(point, {
            x: element.x * zoom + panOffset.x,
            y: element.y * zoom + panOffset.y,
            width: textWidth,
            height: fontSize
        });
    } else {
        // Door, Window, Camera - point-based elements
        const dx = point.x - (element.x * zoom + panOffset.x);
        const dy = point.y - (element.y * zoom + panOffset.y);
        return Math.sqrt(dx * dx + dy * dy) < 20 * zoom;
    }
}

// marquee
export function findElementsInMarquee(
    marqueeRect: { x: number; y: number; width: number; height: number },
    elements: FloorPlanElement[],
    panOffset: Point,
    zoom: number = 1
): FloorPlanElement[] {
    return elements.filter((element) => {
        if (element.type === 'room') {
            const elementRect = {
                x: element.x * zoom + panOffset.x,
                y: element.y * zoom + panOffset.y,
                width: element.width * zoom,
                height: element.height * zoom,
            };
            return isPointInRect({ x: elementRect.x, y: elementRect.y }, marqueeRect) ||
                isPointInRect({ x: elementRect.x + elementRect.width, y: elementRect.y }, marqueeRect) ||
                isPointInRect({ x: elementRect.x, y: elementRect.y + elementRect.height }, marqueeRect) ||
                isPointInRect({ x: elementRect.x + elementRect.width, y: elementRect.y + elementRect.height }, marqueeRect) ||
                isPointInRect({ x: marqueeRect.x, y: marqueeRect.y }, elementRect) ||
                isPointInRect({ x: marqueeRect.x + marqueeRect.width, y: marqueeRect.y }, elementRect) ||
                isPointInRect({ x: marqueeRect.x, y: marqueeRect.y + marqueeRect.height }, elementRect) ||
                isPointInRect({ x: marqueeRect.x + marqueeRect.width, y: marqueeRect.y + marqueeRect.height }, elementRect);
        } else if (element.type === 'wall') {
            const x1 = element.x1 * zoom + panOffset.x;
            const y1 = element.y1 * zoom + panOffset.y;
            const x2 = element.x2 * zoom + panOffset.x;
            const y2 = element.y2 * zoom + panOffset.y;

            // Check if either endpoint is in the marquee
            return isPointInRect({ x: x1, y: y1 }, marqueeRect) ||
                isPointInRect({ x: x2, y: y2 }, marqueeRect);
        } else if (element.type === 'pencil') {
            // Check if any point in the path is within the marquee
            return element.points.some((p) => {
                const screenPoint = {
                    x: p.x * zoom + panOffset.x,
                    y: p.y * zoom + panOffset.y,
                };
                return isPointInRect(screenPoint, marqueeRect);
            });
        } else if (element.type === 'text') {
            const screenPoint = {
                x: element.x * zoom + panOffset.x,
                y: element.y * zoom + panOffset.y,
            };
            return isPointInRect(screenPoint, marqueeRect);
        } else {
            // Door, Window, Camera - point-based elements
            const screenPoint = {
                x: element.x * zoom + panOffset.x,
                y: element.y * zoom + panOffset.y,
            };
            return isPointInRect(screenPoint, marqueeRect);
        }
    });
}
