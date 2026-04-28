import whiteLogo from '../../Assets/white logo.png'
import navyLogo from '../../Assets/navy logo.png'

export default function ThemeLogo({ className = '', alt = 'LanceLB', style }) {
  return (
    <>
      <img src={whiteLogo} alt={alt} className={`theme-logo-dark ${className}`} style={style} />
      <img src={navyLogo} alt="" className={`theme-logo-light ${className}`} style={style} aria-hidden="true" />
    </>
  )
}
