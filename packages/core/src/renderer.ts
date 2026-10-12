import Yoga from 'yoga-layout';
import renderNodeToOutput, {
	renderNodeToScreenReaderOutput,
} from './render-node-to-output.js';
import Output from './output.js';
import {type DOMElement, type DOMNode} from './dom.js';

type Result = {
	output: string;
	outputHeight: number;
	staticOutput: string;
};

const getVisibleStaticNode = (
	node: DOMElement | undefined,
): DOMElement | undefined => {
	// Static output is rendered separately, so ancestor visibility must be checked explicitly.
	for (let ancestor = node; ancestor; ancestor = ancestor.parentNode) {
		if (ancestor.yogaNode?.getDisplay() === Yoga.DISPLAY_NONE) {
			return undefined;
		}
	}

	return node;
};

// A <Static> child is pending until its output is written. Children hidden with display: none are never written, so they stay pending.
const isPendingStaticChild = (child: DOMNode): boolean => {
	const element = child as DOMElement;
	return (
		!element.staticOutputWritten &&
		element.yogaNode !== undefined &&
		element.yogaNode.getDisplay() !== Yoga.DISPLAY_NONE
	);
};

// Returns the visible <Static> node only when it has output that has not been written yet. Its Yoga height still covers written children, so the height alone cannot tell.
const getPendingStaticNode = (node: DOMElement): DOMElement | undefined => {
	const staticNode = getVisibleStaticNode(node.staticNode);

	return staticNode?.childNodes.some((child) => isPendingStaticChild(child))
		? staticNode
		: undefined;
};

// Call after a render whose staticOutput was written. The written children stay attached until <Static> re-renders, so mark them to keep later renders from writing them again.
export const markStaticOutputWritten = (node: DOMElement): void => {
	const staticNode = getVisibleStaticNode(node.staticNode);

	for (const child of staticNode?.childNodes ?? []) {
		if (isPendingStaticChild(child)) {
			(child as DOMElement).staticOutputWritten = true;
		}
	}
};

const renderer = (node: DOMElement, isScreenReaderEnabled: boolean): Result => {
	if (node.yogaNode) {
		const staticNode = getPendingStaticNode(node);

		if (isScreenReaderEnabled) {
			const output = renderNodeToScreenReaderOutput(node, {
				skipStaticElements: true,
			});

			const outputHeight = output === '' ? 0 : output.split('\n').length;

			let staticOutput = '';

			if (staticNode) {
				staticOutput = renderNodeToScreenReaderOutput(staticNode, {
					skipStaticElements: false,
				});
			}

			return {
				output,
				outputHeight,
				staticOutput: staticOutput === '' ? '' : `${staticOutput}\n`,
			};
		}

		const output = new Output({
			width: node.yogaNode.getComputedWidth(),
			height: node.yogaNode.getComputedHeight(),
		});

		renderNodeToOutput(node, output, {
			skipStaticElements: true,
		});

		let staticOutput;

		if (staticNode?.yogaNode) {
			const {yogaNode} = staticNode;
			staticOutput = new Output({
				width:
					yogaNode.getComputedLeft() +
					yogaNode.getComputedWidth() +
					yogaNode.getComputedMargin(Yoga.EDGE_RIGHT),
				height:
					yogaNode.getComputedTop() +
					yogaNode.getComputedHeight() +
					yogaNode.getComputedMargin(Yoga.EDGE_BOTTOM),
			});

			renderNodeToOutput(staticNode, staticOutput, {
				skipStaticElements: false,
			});
		}

		const {output: generatedOutput, height: outputHeight} = output.get();

		return {
			output: generatedOutput,
			outputHeight,
			// Newline at the end is needed, because static output doesn't have one, so
			// interactive output will override last line of static output
			staticOutput:
				staticOutput && staticOutput.height > 0
					? `${staticOutput.get().output}\n`
					: '',
		};
	}

	return {
		output: '',
		outputHeight: 0,
		staticOutput: '',
	};
};

export default renderer;
