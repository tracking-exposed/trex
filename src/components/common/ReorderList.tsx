import { Grid, GridSpacing } from '@material-ui/core';
import React from 'react';
import { DropTargetMonitor, useDrag, useDrop } from 'react-dnd';

interface Item {
  index: number;
}

const style = {
  cursor: 'move',
};

interface ReorderListItemProps<I extends Item> {
  item: I;
  index: number;
  moveListItem: (dragIndex: number, hoverIndex: number) => void;
  onDropCompleted: (item: I) => void;
  renderItem: (item: I, index: number) => JSX.Element;
}

const ReorderListItem = <I extends Item>({
  item,
  index,
  moveListItem,
  onDropCompleted,
  renderItem,
}: ReorderListItemProps<I>): React.ReactElement => {
  const ref = React.useRef<HTMLDivElement>(null);
  const [{ handlerId }, drop] = useDrop({
    accept: 'Card',
    collect(monitor) {
      return {
        handlerId: monitor.getHandlerId(),
      };
    },
    drop: (item: I) => {
      onDropCompleted(item);
    },
    hover(item: I, monitor: DropTargetMonitor) {
      if (ref.current == null) {
        return;
      }
      const dragIndex = item.index;
      const hoverIndex = index;

      // Don't replace items with themselves
      if (dragIndex === hoverIndex) {
        return;
      }

      // Time to actually perform the action
      moveListItem(dragIndex, hoverIndex);

      // Note: we're mutating the monitor item here!
      // Generally it's better to avoid mutations,
      // but it's good here for the sake of performance
      // to avoid expensive index searches.
      item.index = hoverIndex;
    },
  });

  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'Card',
    item,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  const opacity = isDragging ? 0 : 1;

  drag(drop(ref));

  return (
    <div ref={ref} style={{ ...style, opacity }} data-handler-id={handlerId}>
      {renderItem(item, index)}
    </div>
  );
};

interface ReorderListProps<I extends Item> {
  items: I[];
  compareItem: (i1: I, i2: I) => boolean;
  getKey: (item: I) => string;
  renderItem: (i: I, index: number) => JSX.Element;
  onDragComplete: (items: I[]) => void;
  spacing?: GridSpacing;
}

export const ReorderList = <I extends Item>(
  props: ReorderListProps<I>
): React.ReactElement => {
  const [items, setItems] = React.useState<I[]>([]);

  React.useEffect(() => {
    // update state items with items coming from props
    setItems(props.items);
  }, [props.items]);

  const moveListItem = React.useCallback(
    (dragIndex: number, hoverIndex: number): void => {
      const dragItem = items[dragIndex];
      if (dragItem === undefined) {
        return;
      }

      items.splice(dragIndex, 1);
      items.splice(hoverIndex, 0, dragItem);

      setItems(items);
    },
    [items]
  );

  const onDropCompleted = React.useCallback(
    (item: I) => {
      props.onDragComplete(items);
    },
    [items]
  );

  return (
    <Grid container spacing={props.spacing ?? 0}>
      {items.map((item, i) => (
        <Grid item xs={12} key={props.getKey(item)}>
          <ReorderListItem
            index={i}
            item={item}
            moveListItem={moveListItem}
            onDropCompleted={onDropCompleted}
            renderItem={props.renderItem}
          />
        </Grid>
      ))}
    </Grid>
  );
};
