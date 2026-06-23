import { type Dispatch, type SetStateAction } from 'react';
import Image from 'next/image';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

export function AuctionGallery({
  detailImages,
  imgIdx,
  setImgIdx,
  thumbStart,
  setThumbStart,
  hasThumbOverflow,
  maxThumbStart,
  visibleThumbs,
  mainImg,
  onOpenLightbox,
}: {
  detailImages: string[];
  imgIdx: number;
  setImgIdx: Dispatch<SetStateAction<number>>;
  thumbStart: number;
  setThumbStart: Dispatch<SetStateAction<number>>;
  hasThumbOverflow: boolean;
  maxThumbStart: number;
  visibleThumbs: number;
  mainImg: string;
  onOpenLightbox: () => void;
}) {
  return (
    <div className="flex items-stretch gap-3 sm:gap-4">
      <div className="flex w-14 shrink-0 flex-col items-center gap-2 sm:w-[4.5rem]">
        {hasThumbOverflow ? (
          <button
            type="button"
            onClick={() => setThumbStart((v) => Math.max(0, v - 1))}
            disabled={thumbStart <= 0}
            className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 transition hover:border-[#FF7300] hover:text-[#FF7300] disabled:opacity-40"
          >
            <ChevronUp className="h-4 w-4" />
          </button>
        ) : null}

        {(hasThumbOverflow ? detailImages.slice(thumbStart, thumbStart + visibleThumbs) : detailImages).map((src, i) => {
          const absoluteIndex = hasThumbOverflow ? thumbStart + i : i;
          return (
            <button
              key={`${src}-${absoluteIndex}`}
              type="button"
              onClick={() => setImgIdx(absoluteIndex)}
              className={`relative aspect-[63/88] w-full overflow-hidden rounded-lg border-2 bg-gray-50 transition ${
                imgIdx === absoluteIndex ? 'border-[#FF7300] ring-2 ring-[#FF7300]/20' : 'border-gray-200 hover:border-gray-400'
              }`}
            >
              <Image src={src} alt="" fill className="object-cover" sizes="72px" unoptimized />
            </button>
          );
        })}

        {hasThumbOverflow ? (
          <button
            type="button"
            onClick={() => setThumbStart((v) => Math.min(maxThumbStart, v + 1))}
            disabled={thumbStart >= maxThumbStart}
            className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 transition hover:border-[#FF7300] hover:text-[#FF7300] disabled:opacity-40"
          >
            <ChevronDown className="h-4 w-4" />
          </button>
        ) : null}
      </div>
      <div className="group relative min-h-[240px] flex-1 overflow-hidden rounded-2xl border border-transparent bg-white/0 shadow-none sm:min-h-[300px] lg:min-h-[340px]">
        <button
          type="button"
          onClick={onOpenLightbox}
          className="absolute inset-0 z-10 cursor-zoom-in"
          aria-label="Apri immagine in grande"
        />
        <Image
          src={mainImg}
          alt=""
          fill
          className="object-contain"
          sizes="(max-width:1024px) 100vw, 420px"
          priority
          unoptimized
        />
        {detailImages.length > 1 ? (
          <>
            <button
              type="button"
              onClick={() => setImgIdx((v) => (v - 1 + detailImages.length) % detailImages.length)}
              className="absolute left-2 top-1/2 z-20 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-gray-800 shadow transition hover:bg-white group-hover:flex"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => setImgIdx((v) => (v + 1) % detailImages.length)}
              className="absolute right-2 top-1/2 z-20 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-gray-800 shadow transition hover:bg-white group-hover:flex"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}
