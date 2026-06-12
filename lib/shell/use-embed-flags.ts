'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { isEmbedMode, isReadonlyEmbed } from './embed';

export type EmbedFlags = {
  embed: boolean;
  readonly: boolean;
};

function readEmbedFlags(): EmbedFlags {
  if (typeof window === 'undefined') {
    return { embed: false, readonly: false };
  }
  const search = window.location.search;
  return {
    embed: isEmbedMode(search),
    readonly: isReadonlyEmbed(search),
  };
}

/** Client-only URL flags for embed / readonly demo modes. */
export function useEmbedFlags(): EmbedFlags {
  const pathname = usePathname();
  const [flags, setFlags] = useState<EmbedFlags>(readEmbedFlags);

  useEffect(() => {
    setFlags(readEmbedFlags());
  }, [pathname]);

  return flags;
}
