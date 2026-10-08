// Re-export Material Symbols Rounded (Filled) as SFSymbol for seamless backward compatibility
export * from './MaterialSymbol';
export { MaterialSymbol as SFSymbol, MATERIAL_SYMBOLS_MAP as SF_ICONS_MAP, createMaterialSymbolIcon as createSFSymbolIcon } from './MaterialSymbol';
export type { MaterialSymbolProps as SFSymbolProps } from './MaterialSymbol';
import MaterialSymbol from './MaterialSymbol';
export default MaterialSymbol;
