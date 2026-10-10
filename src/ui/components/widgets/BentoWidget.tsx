import React from 'react';
import { SmallWidget } from './SmallWidget';
import { SquareWidget } from './SquareWidget';
import { LargeWidget } from './LargeWidget';
import {
  SmallWidgetProps,
  SquareWidgetProps,
  LargeWidgetProps,
} from './types';

export type BentoWidgetVariant = 'small' | 'square' | 'large';

export type BentoWidgetProps =
  | ({ variant: 'small' } & SmallWidgetProps)
  | ({ variant: 'square' } & SquareWidgetProps)
  | ({ variant: 'large' } & LargeWidgetProps);

/**
 * BentoWidget - Unified entry point for OneWebUI Bento Widgets.
 * Can be used as polymorphic component via variant prop or as compound components:
 * - BentoWidget.Small
 * - BentoWidget.Square
 * - BentoWidget.Large
 */
export const BentoWidget: React.FC<BentoWidgetProps> & {
  Small: typeof SmallWidget;
  Square: typeof SquareWidget;
  Large: typeof LargeWidget;
} = (props) => {
  switch (props.variant) {
    case 'small': {
      const { variant: _, ...rest } = props;
      return <SmallWidget {...rest} />;
    }
    case 'square': {
      const { variant: _, ...rest } = props;
      return <SquareWidget {...rest} />;
    }
    case 'large': {
      const { variant: _, ...rest } = props;
      return <LargeWidget {...rest} />;
    }
    default:
      return null;
  }
};

BentoWidget.Small = SmallWidget;
BentoWidget.Square = SquareWidget;
BentoWidget.Large = LargeWidget;

/** Alias */
export const Widget = BentoWidget;
