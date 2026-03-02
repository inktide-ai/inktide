import styles from './GlitchText.module.css'
import classnames from 'classnames'

interface GlitchTextProps {
  text: string
  tag?: 'h1' | 'h2' | 'h3' | 'span'
  className?: string
  id?: string
}

const GlitchText = ({ text, tag: Tag = 'h2', className, id }: GlitchTextProps) => (
  <Tag id={id} className={classnames(styles.glitch, className)} data-text={text}>
    {text}
  </Tag>
)

export default GlitchText
