import React, { useState, useRef, useEffect, useCallback, PropsWithChildren } from 'react';

const Draggable: React.FC<PropsWithChildren<{}>> = ({ children }) => {
    const [position, setPosition] = useState({ x: 100, y: 100 });
    const [isDragging, setIsDragging] = useState(false);
    const dragRef = useRef<HTMLDivElement>(null);
    const offset = useRef({ x: 0, y: 0 });

    const onMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        // Only drag when the top part of the widget is clicked (e.g., a header)
        // For simplicity, we assume a small top area is the handle.
        if (dragRef.current && e.nativeEvent.offsetY < 40) { // Draggable area is top 40px
            setIsDragging(true);
            offset.current = {
                x: e.clientX - dragRef.current.getBoundingClientRect().left,
                y: e.clientY - dragRef.current.getBoundingClientRect().top,
            };
            document.body.style.userSelect = 'none'; // Prevent text selection
        }
    }, []);

    const onMouseMove = useCallback((e: MouseEvent) => {
        if (!isDragging) return;
        setPosition({
            x: e.clientX - offset.current.x,
            y: e.clientY - offset.current.y,
        });
    }, [isDragging]);

    const onMouseUp = useCallback(() => {
        setIsDragging(false);
        document.body.style.userSelect = ''; // Re-enable text selection
    }, []);

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', onMouseMove);
            window.addEventListener('mouseup', onMouseUp);
        } else {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        };
    }, [isDragging, onMouseMove, onMouseUp]);
    
    return (
        <div ref={dragRef} style={{ position: 'absolute', left: position.x, top: position.y, cursor: isDragging ? 'grabbing' : 'grab', zIndex: 1000 }} onMouseDown={onMouseDown}>
            {children}
        </div>
    );
};

export default Draggable;