
import React, { useCallback, useRef, useState } from 'react';

interface Options {
  shouldPreventDefault?: boolean;
  delay?: number;
}

const isTouchEvent = (event: Event | React.TouchEvent | React.MouseEvent): event is React.TouchEvent => {
  return 'touches' in event;
};

const preventDefault = (event: Event) => {
  if (!('touches' in event)) return;
  const touchEvent = event as TouchEvent;

  if (touchEvent.touches.length < 2 && event.preventDefault) {
    event.preventDefault();
  }
};

export const useLongPress = (
  onLongPress: (event: React.MouseEvent | React.TouchEvent) => void,
  onClick: () => void,
  { shouldPreventDefault = true, delay = 500 }: Options = {}
) => {
  const [longPressTriggered, setLongPressTriggered] = useState(false);
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const target = useRef<EventTarget | null>(null);
  
  // Movement detection
  const startCoord = useRef({ x: 0, y: 0 });
  const isScrolling = useRef(false);

  const start = useCallback(
    (event: React.MouseEvent | React.TouchEvent) => {
      // Record start position
      if (isTouchEvent(event)) {
        startCoord.current = { x: event.touches[0].clientX, y: event.touches[0].clientY };
      } else {
        startCoord.current = { x: event.clientX, y: event.clientY };
      }
      isScrolling.current = false;

      if (shouldPreventDefault && event.target) {
        event.target.addEventListener('touchend', preventDefault, {
          passive: false,
        });
        target.current = event.target;
      }
      
      setLongPressTriggered(false);
      timeout.current = setTimeout(() => {
        // Only trigger long press if not scrolling
        if (!isScrolling.current) {
          onLongPress(event);
          setLongPressTriggered(true);
        }
      }, delay);
    },
    [onLongPress, delay, shouldPreventDefault]
  );

  const move = useCallback(
    (event: React.MouseEvent | React.TouchEvent) => {
        // If already detected as scrolling, ignore
        if (isScrolling.current) return;

        let clientX, clientY;
        if (isTouchEvent(event)) {
            clientX = event.touches[0].clientX;
            clientY = event.touches[0].clientY;
        } else {
            clientX = event.clientX;
            clientY = event.clientY;
        }

        const dx = Math.abs(clientX - startCoord.current.x);
        const dy = Math.abs(clientY - startCoord.current.y);

        // Threshold of 10px to consider it a scroll/drag
        if (dx > 10 || dy > 10) {
            isScrolling.current = true;
            if (timeout.current) {
                clearTimeout(timeout.current);
                timeout.current = null;
            }
        }
    },
    []
  );

  const clear = useCallback(
    (event: React.MouseEvent | React.TouchEvent, shouldTriggerClick = true) => {
      if (timeout.current) {
        clearTimeout(timeout.current);
      }
      if (shouldPreventDefault && target.current) {
        target.current.removeEventListener('touchend', preventDefault);
      }
      
      // Trigger click only if:
      // 1. shouldTriggerClick is true
      // 2. Long press wasn't triggered
      // 3. User didn't scroll/drag significantly
      if (shouldTriggerClick && !longPressTriggered && !isScrolling.current) {
        onClick();
      }
      
      setTimeout(() => setLongPressTriggered(false), 100);
    },
    [shouldPreventDefault, onClick, longPressTriggered]
  );

  return {
    onMouseDown: (e: React.MouseEvent) => start(e),
    onTouchStart: (e: React.TouchEvent) => start(e),
    onMouseMove: (e: React.MouseEvent) => move(e),
    onTouchMove: (e: React.TouchEvent) => move(e),
    onMouseUp: (e: React.MouseEvent) => clear(e),
    onMouseLeave: (e: React.MouseEvent) => clear(e, false),
    onTouchEnd: (e: React.TouchEvent) => clear(e),
    onContextMenu: (e: React.MouseEvent) => e.preventDefault() 
  };
};
