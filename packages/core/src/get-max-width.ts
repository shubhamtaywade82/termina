import Yoga, {type Node as YogaNode} from 'yoga-layout';

const getMaxWidth = (yogaNode: YogaNode) =>
	yogaNode.getComputedWidth() -
	yogaNode.getComputedPadding(Yoga.EDGE_LEFT) -
	yogaNode.getComputedPadding(Yoga.EDGE_RIGHT) -
	yogaNode.getComputedBorder(Yoga.EDGE_LEFT) -
	yogaNode.getComputedBorder(Yoga.EDGE_RIGHT);

// Yoga rounds a fractional share of a flex row up to a whole column, so a text node can be one column wider than the box that holds it. The parent's content width is the room the text really has, so wrapping never goes past it.
export const getAvailableTextWidth = (yogaNode: YogaNode): number => {
	const ownWidth = getMaxWidth(yogaNode);
	const parent = yogaNode.getParent();
	const parentWidth = parent ? getMaxWidth(parent) : Infinity;

	// A parent narrower than one column rounds down to zero, which would stop the text from wrapping at all. The text keeps its own width there.
	return parentWidth >= 1 ? Math.min(ownWidth, parentWidth) : ownWidth;
};

export default getMaxWidth;
