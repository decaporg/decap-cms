import React, {useEffect, useState, useCallback, useRef} from "react";

import Pane from "./Pane";
import Resizer, {RESIZER_DEFAULT_CLASSNAME} from "./Resizer";

function unFocus(document, window) {
    if (document.selection) {
        document.selection.empty();
    } else {
        try {
            window.getSelection().removeAllRanges();
            // eslint-disable-next-line no-empty
        } catch (e) {}
    }
}

function getDefaultSize(defaultSize, minSize, maxSize, draggedSize) {
    if (typeof draggedSize === "number") {
        const min = typeof minSize === "number" ? minSize : 0;
        const max = typeof maxSize === "number" && maxSize >= 0 ? maxSize : Infinity;
        return Math.max(min, Math.min(max, draggedSize));
    }
    if (defaultSize !== undefined) {
        return defaultSize;
    }
    return minSize;
}

function removeNullChildren(children) {
    return React.Children.toArray(children).filter(c => c);
}

const SplitPane = (props) => {

    const {
        allowResize = true,
        children,
        className,
        defaultSize,
        minSize = 50,
        maxSize,
        onChange,
        onDragFinished,
        onDragStarted,
        onResizerClick,
        onResizerDoubleClick,
        paneClassName = "",
        pane1ClassName = "",
        pane2ClassName = "",
        paneStyle,
        primary = "first",
        pane1Style: pane1StyleProps,
        pane2Style: pane2StyleProps,
        resizerClassName,
        resizerStyle,
        size,
        split = "vertical",
        step,
        style: styleProps,
    } = props;

    const initialSize = size !== undefined ? size : getDefaultSize(defaultSize, minSize, maxSize, null);

    const [active, setActive] = useState(false);
    const [, setResized] = useState(false);
    const [pane1Size, setPane1Size] = useState(primary === "first" ? initialSize : undefined);
    const [pane2Size, setPane2Size] = useState(primary === "second" ? initialSize : undefined);
    const [draggedSize, setDraggedSize] = useState();
    const [position, setPosition] = useState();        

    const splitPane = useRef();
    const pane1 = useRef();
    const pane2 = useRef();
    const instanceProps = useRef({ size });
   
    const getSizeUpdate = useCallback(() => {
        if (instanceProps.current.size === size && size !== undefined) {
            return undefined;
        }

        const newSize = size !== undefined ? size : getDefaultSize(
            defaultSize, minSize, maxSize, draggedSize
        );

        if (size !== undefined) {
            setDraggedSize(newSize);
        }

        const isPanel1Primary = primary === "first";
        if (isPanel1Primary) {
            setPane1Size(newSize);
            setPane2Size(undefined);
        } else {        
            setPane2Size(newSize);
            setPane1Size(undefined);
        }

        instanceProps.current.size = newSize;

    }, [defaultSize, draggedSize, maxSize, minSize, primary, size]);

    const onMouseUp = useCallback(() => {        
        if (allowResize && active) {
            if (typeof onDragFinished === "function") {
                onDragFinished(draggedSize);
            }
            setActive(false);
        }
    }, [active, allowResize, draggedSize, onDragFinished]);   

    const onTouchMove = useCallback((event) => {        
        if (allowResize && active) {
            unFocus(document, window);
            const isPrimaryFirst = primary === "first";
            const ref = isPrimaryFirst ? pane1.current : pane2.current;
            const ref2 = isPrimaryFirst ? pane2.current : pane1.current;
            if (ref) {
                const node = ref;
                const node2 = ref2;

                if (node.getBoundingClientRect) {
                    const width = node.getBoundingClientRect().width;
                    const height = node.getBoundingClientRect().height;
                    const current =
            split === "vertical"
                ? event.touches[0].clientX
                : event.touches[0].clientY;
                    const size = split === "vertical" ? width : height;
                    let positionDelta = position - current;
                    if (step) {
                        if (Math.abs(positionDelta) < step) {
                            return;
                        }
                        // Integer division
                        // eslint-disable-next-line no-bitwise
                        positionDelta = ~~(positionDelta / step) * step;
                    }
                    let sizeDelta = isPrimaryFirst ? positionDelta : -positionDelta;

                    const pane1Order = parseInt(window.getComputedStyle(node).order);
                    const pane2Order = parseInt(window.getComputedStyle(node2).order);
                    if (pane1Order > pane2Order) {
                        sizeDelta = -sizeDelta;
                    }

                    let newMaxSize = maxSize;
                    if (maxSize !== undefined && maxSize <= 0) {                        
                        if (split === "vertical") {
                            newMaxSize = splitPane.current.getBoundingClientRect().width + maxSize;
                        } else {
                            newMaxSize = splitPane.current.getBoundingClientRect().height + maxSize;
                        }
                    }

                    let newSize = size - sizeDelta;
                    const newPosition = position - positionDelta;

                    if (newSize < minSize) {
                        newSize = minSize;
                    } else if (maxSize !== undefined && newSize > newMaxSize) {
                        newSize = newMaxSize;
                    } else {
                        setPosition(newPosition);
                        setResized(true);                        
                    }

                    if (onChange) onChange(newSize);

                    setDraggedSize(newSize);
                    if (isPrimaryFirst)
                        setPane1Size(newSize);
                    else 
                        setPane2Size(newSize);                    
                }
            }
        }
    }, [active, allowResize, maxSize, minSize, onChange, position, primary, split, step]);

    const onMouseMove = useCallback((event) => {
        const eventWithTouches = Object.assign({}, event, {
            touches: [{ clientX: event.clientX, clientY: event.clientY }],
        });
        onTouchMove(eventWithTouches);
    }, [onTouchMove]);

    const onTouchStart = useCallback((event) => {        
        if (allowResize) {
            unFocus(document, window);
            const position =
        split === "vertical"
            ? event.touches[0].clientX
            : event.touches[0].clientY;

            if (typeof onDragStarted === "function") {
                onDragStarted();
            }
            setActive(true);
            setPosition(position);            
        }
    }, [allowResize, onDragStarted, split]);

    const onMouseDown = useCallback((event) => {
        const eventWithTouches = Object.assign({}, event, {
            touches: [{ clientX: event.clientX, clientY: event.clientY }],
        });
        onTouchStart(eventWithTouches);
    }, [onTouchStart]);

    useEffect(() => {

        document.addEventListener("mouseup", onMouseUp);
        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("touchmove", onTouchMove);

        getSizeUpdate();

        return () => {
            document.removeEventListener("mouseup", onMouseUp);
            document.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("touchmove", onTouchMove);
        };

    }, [onMouseUp, onMouseMove, onTouchMove, getSizeUpdate]);

    const disabledClass = allowResize ? "" : "disabled";
    const resizerClassNamesIncludingDefault = resizerClassName
        ? `${resizerClassName} ${RESIZER_DEFAULT_CLASSNAME}`
        : resizerClassName;

    const notNullChildren = removeNullChildren(children);

    const style = {
        display: "flex",
        flex: 1,
        height: "100%",
        position: "absolute",
        outline: "none",
        overflow: "hidden",
        MozUserSelect: "text",
        WebkitUserSelect: "text",
        msUserSelect: "text",
        userSelect: "text",
        ...styleProps,
    };

    if (split === "vertical") {
        Object.assign(style, {
            flexDirection: "row",
            left: 0,
            right: 0,
        });
    } else {
        Object.assign(style, {
            bottom: 0,
            flexDirection: "column",
            minHeight: "100%",
            top: 0,
            width: "100%",
        });
    }

    const classes = ["SplitPane", className, split, disabledClass];

    const pane1Style = { ...paneStyle, ...pane1StyleProps };
    const pane2Style = { ...paneStyle, ...pane2StyleProps };

    const pane1Classes = ["Pane1", paneClassName, pane1ClassName].join(" ");
    const pane2Classes = ["Pane2", paneClassName, pane2ClassName].join(" ");

    return (
        <div
            className={classes.join(" ")}
            ref={node => {
                splitPane.current = node;
            }}
            style={style}
        >
            <Pane
                className={pane1Classes}
                key="pane1"
                eleRef={node => {
                    pane1.current = node;
                }}
                size={pane1Size}
                split={split}
                style={pane1Style}
            >
                {notNullChildren[0]}
            </Pane>
            <Resizer
                className={disabledClass}
                onClick={onResizerClick}
                onDoubleClick={onResizerDoubleClick}
                onMouseDown={onMouseDown}
                onTouchStart={onTouchStart}
                onTouchEnd={onMouseUp}
                key="resizer"
                resizerClassName={resizerClassNamesIncludingDefault}
                split={split}
                style={resizerStyle || {}}
            />
            <Pane
                className={pane2Classes}
                key="pane2"
                eleRef={node => {
                    pane2.current = node;
                }}
                size={pane2Size}
                split={split}
                style={pane2Style}
            >
                {notNullChildren[1]}
            </Pane>
        </div>
    );
};

export default SplitPane;