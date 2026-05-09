import whiteLogoSvg    from '../../Assets/white logo.svg'
import navyLogoSvg     from '../../Assets/navy logo.svg'
import whiteFaviconSvg from '../../Assets/white favicon.svg'
import navyFaviconSvg  from '../../Assets/navy favicon.svg'

export default function ThemeLogo({ className = '', alt = 'Lance', style }) {
  return (
    <>
      <img src={whiteLogoSvg} alt={alt} className={`theme-logo-dark ${className}`} style={style} />
      <img src={navyLogoSvg}  alt=""    className={`theme-logo-light ${className}`} style={style} aria-hidden="true" />
    </>
  )
}

const BRAND_LETTERS = ['L','a','n','c','e']

export function ThemeNavBrand() {
  return (
    <span className="tnb-wrap">
      {/* Favicon icon — always visible, never animates */}
      <img src={whiteFaviconSvg} alt="Lance" className="tnb-fav tnb-dark" />
      <img src={navyFaviconSvg}  alt="Lance" className="tnb-fav tnb-light" aria-hidden />

      {/* Brand letters — stagger slide-in from right on hover */}
      <span className="tnb-letters" aria-hidden="true">
        {BRAND_LETTERS.map((letter, i) => (
          <span key={i} className="tnb-letter" style={{ '--i': i }}>{letter}</span>
        ))}
      </span>
    </span>
  )
}
