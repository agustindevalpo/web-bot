'use client'

import { useState } from 'react'
import styles from './page.module.css'

interface FaqItem {
  q: string
  a: string
}

export function LandingFAQ({ items }: { items: FaqItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <div className={styles.faqList}>
      {items.map((item, i) => {
        const open = openIndex === i
        return (
          <div key={item.q} className={styles.faqItem}>
            <button
              type="button"
              className={styles.faqQuestion}
              onClick={() => setOpenIndex(open ? null : i)}
              aria-expanded={open}
            >
              <span>{item.q}</span>
              <span className={styles.faqIcon}>{open ? '–' : '+'}</span>
            </button>
            {open && <div className={styles.faqAnswer}>{item.a}</div>}
          </div>
        )
      })}
    </div>
  )
}
