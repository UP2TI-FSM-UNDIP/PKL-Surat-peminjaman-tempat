type RollLinkProps = {
  children: string;
};

/**
 * Teks yang bergulir ke atas saat hover. Salinan kedua hanya untuk animasi,
 * jadi disembunyikan dari pembaca layar.
 */
export function RollLink({ children }: RollLinkProps) {
  return (
    <span className='roll-link'>
      <span className='roll-link__label'>{children}</span>
      <span className='roll-link__label' aria-hidden='true'>
        {children}
      </span>
    </span>
  );
}
