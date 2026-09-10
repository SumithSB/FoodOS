import type { IconProps } from '@phosphor-icons/react'
import {
  Barcode,
  Camera,
  CheckCircle,
  ClipboardText,
  Copy,
  MagnifyingGlass,
  Warning,
  WarningCircle,
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
