import type { IconProps } from '@phosphor-icons/react'
import {
  Barcode,
  Camera,
  CaretDown,
  Check,
  CheckCircle,
  ClipboardText,
  Copy,
  Keyboard,
  Leaf,
  MagnifyingGlass,
  Warning,
  WarningCircle,
  X,
  XCircle,
} from '@phosphor-icons/react'

const defaultProps: Pick<IconProps, 'size' | 'weight' | 'aria-hidden'> = {
  size: 20,
  weight: 'regular',
  'aria-hidden': true,
}

export const CameraIcon = (props: IconProps) => <Camera {...defaultProps} {...props} />
export const BarcodeIcon = (props: IconProps) => <Barcode {...defaultProps} {...props} />
export const CheckCircleIcon = (props: IconProps) => <CheckCircle {...defaultProps} {...props} />
export const XCircleIcon = (props: IconProps) => <XCircle {...defaultProps} {...props} />
export const WarningIcon = (props: IconProps) => <Warning {...defaultProps} {...props} />
export const WarningCircleIcon = (props: IconProps) => (
  <WarningCircle {...defaultProps} {...props} />
)
export const ClipboardIcon = (props: IconProps) => <ClipboardText {...defaultProps} {...props} />
export const CopyIcon = (props: IconProps) => <Copy {...defaultProps} {...props} />
export const SearchIcon = (props: IconProps) => <MagnifyingGlass {...defaultProps} {...props} />
export const KeyboardIcon = (props: IconProps) => <Keyboard {...defaultProps} {...props} />
export const CaretDownIcon = (props: IconProps) => <CaretDown {...defaultProps} {...props} />
export const CheckIcon = (props: IconProps) => <Check {...defaultProps} {...props} />
export const CloseIcon = (props: IconProps) => <X {...defaultProps} {...props} />
export const LeafIcon = (props: IconProps) => <Leaf {...defaultProps} {...props} />
