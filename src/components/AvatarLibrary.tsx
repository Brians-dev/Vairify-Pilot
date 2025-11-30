import { cn } from "@/lib/utils";

interface AvatarLibraryProps {
  selectedAvatar?: string | null;
  onSelect: (url: string) => void;
}

const avatarOptions = [
  { id: "abstract-aurora", label: "Aurora Bloom", category: "Abstract", url: "https://api.dicebear.com/7.x/shapes/svg?seed=AuroraBloom&backgroundColor=fdf2f8" },
  { id: "abstract-vista", label: "Vista Waves", category: "Abstract", url: "https://api.dicebear.com/7.x/shapes/svg?seed=VistaWaves&backgroundColor=ecfeff" },
  { id: "geometric-orbit", label: "Orbit Pulse", category: "Geometric", url: "https://api.dicebear.com/7.x/bottts/svg?seed=OrbitPulse&backgroundColor=f5f3ff" },
  { id: "geometric-circuit", label: "Circuit Grid", category: "Geometric", url: "https://api.dicebear.com/7.x/bottts/svg?seed=CircuitGrid&backgroundColor=fefce8" },
  { id: "silhouette-midnight", label: "Midnight Glow", category: "Silhouette", url: "https://api.dicebear.com/7.x/avataaars/svg?seed=MidnightGlow&backgroundColor=e0f2fe" },
  { id: "silhouette-dusk", label: "Dusk Silhouette", category: "Silhouette", url: "https://api.dicebear.com/7.x/avataaars/svg?seed=DuskSilhouette&backgroundColor=ffe4e6" },
  { id: "nature-fern", label: "Fern Spirit", category: "Nature", url: "https://api.dicebear.com/7.x/icons/svg?seed=FernSpirit&backgroundColor=dcfce7" },
  { id: "nature-horizon", label: "Horizon Peak", category: "Nature", url: "https://api.dicebear.com/7.x/icons/svg?seed=HorizonPeak&backgroundColor=ede9fe" },
  { id: "abstract-mosaic", label: "Mosaic Flow", category: "Abstract", url: "https://api.dicebear.com/7.x/shapes/svg?seed=MosaicFlow&backgroundColor=fff7ed" },
  { id: "geometric-prism", label: "Prism Forge", category: "Geometric", url: "https://api.dicebear.com/7.x/bottts/svg?seed=PrismForge&backgroundColor=fef2ff" },
  { id: "silhouette-solstice", label: "Solstice", category: "Silhouette", url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Solstice&backgroundColor=e0f2f1" },
  { id: "nature-tide", label: "Tide Whisper", category: "Nature", url: "https://api.dicebear.com/7.x/icons/svg?seed=TideWhisper&backgroundColor=e0f2fe" },
  { id: "abstract-nebula", label: "Nebula Drift", category: "Abstract", url: "https://api.dicebear.com/7.x/shapes/svg?seed=NebulaDrift&backgroundColor=fde68a" },
  { id: "geometric-vertex", label: "Vertex Grid", category: "Geometric", url: "https://api.dicebear.com/7.x/bottts/svg?seed=VertexGrid&backgroundColor=fce7f3" },
  { id: "silhouette-nova", label: "Nova Muse", category: "Silhouette", url: "https://api.dicebear.com/7.x/avataaars/svg?seed=NovaMuse&backgroundColor=ede9fe" },
  { id: "nature-lumen", label: "Lumen Leaf", category: "Nature", url: "https://api.dicebear.com/7.x/icons/svg?seed=LumenLeaf&backgroundColor=dcfce7" },
  { id: "abstract-zenith", label: "Zenith Flux", category: "Abstract", url: "https://api.dicebear.com/7.x/shapes/svg?seed=ZenithFlux&backgroundColor=ffe4e6" },
  { id: "geometric-atlas", label: "Atlas Core", category: "Geometric", url: "https://api.dicebear.com/7.x/bottts/svg?seed=AtlasCore&backgroundColor=f0f9ff" },
  { id: "silhouette-ember", label: "Ember Shade", category: "Silhouette", url: "https://api.dicebear.com/7.x/avataaars/svg?seed=EmberShade&backgroundColor=ffe4e6" },
  { id: "nature-halo", label: "Halo Grove", category: "Nature", url: "https://api.dicebear.com/7.x/icons/svg?seed=HaloGrove&backgroundColor=ecfccb" },
];

export const AvatarLibrary = ({ selectedAvatar, onSelect }: AvatarLibraryProps) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-h-[360px] overflow-y-auto pr-1">
        {avatarOptions.map((avatar) => (
          <button
            type="button"
            key={avatar.id}
            onClick={() => onSelect(avatar.url)}
            className={cn(
              "rounded-xl border bg-card/40 p-3 flex flex-col items-center gap-2 transition hover:border-primary/70 hover:shadow-sm",
              selectedAvatar === avatar.url && "border-primary ring-2 ring-primary/20 bg-primary/5"
            )}
          >
            <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center overflow-hidden">
              <img
                src={avatar.url}
                alt={avatar.label}
                className="w-14 h-14 object-contain"
                loading="lazy"
              />
            </div>
            <div className="text-xs font-medium text-foreground text-center leading-tight">
              {avatar.label}
            </div>
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
              {avatar.category}
            </div>
          </button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground text-center">
        Avatars powered by DiceBear. Perfect if you&rsquo;re not ready to share a personal photo yet.
      </p>
    </div>
  );
};

