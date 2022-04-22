import Image from 'next/image';
import Link from 'next/link';

import styles from './header.module.scss';

export default function Header(): JSX.Element {
  return (
    <div className={styles.headerContainer}>
      <Link href="/">
        <Image width={240} height={25} src="/Logo.svg" alt="logo" />
      </Link>
    </div>
  );
}
