const Sk = ({ className = "" }: { className?: string }) => (
  <div className={`animate-pulse bg-[#E5E5EA] rounded-lg ${className}`} />
)

export default function CartLoading() {
  return (
    <div className="w-full min-h-screen md:min-h-0" style={{ background: "#F5F5F7" }}>
      {/* mobile skeleton */}
      <div className="md:hidden pb-[220px]">
        <div className="bg-white rounded-b-[24px]">
          <div className="h-11 px-4 flex items-center">
            <Sk className="h-5 w-32" />
          </div>
          <div className="h-14 px-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sk className="w-[22px] h-[22px] rounded-lg" />
              <Sk className="h-5 w-10" />
            </div>
            <div className="flex gap-3">
              <Sk className="w-11 h-11 rounded-full" />
              <Sk className="w-11 h-11 rounded-full" />
              <Sk className="w-11 h-11 rounded-full" />
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-[3px] mt-[3px]">
          {[0, 1, 2].map((n) => (
            <div key={n} className="bg-white rounded-[28px] p-4 flex gap-3">
              <Sk className="w-[99px] h-[132px] rounded-2xl shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <Sk className="h-6 w-28" />
                  <Sk className="w-5 h-5 rounded" />
                </div>
                <Sk className="h-5 w-3/4 mt-2" />
                <Sk className="h-5 w-1/2 mt-1.5" />
                <Sk className="h-5 w-32 mt-2.5" />
                <div className="flex gap-2 mt-3">
                  <Sk className="w-[125px] h-9 rounded-full" />
                  <Sk className="w-[112px] h-11 rounded-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="fixed left-0 right-0 z-40 bg-[#F5F5F7] rounded-t-[24px] p-2" style={{ bottom: "calc(56px + env(safe-area-inset-bottom, 0px))" }}>
          <Sk className="w-full h-[52px] rounded-[26px]" />
        </div>
      </div>

      {/* desktop skeleton */}
      <div className="hidden md:block max-w-[1400px] mx-auto px-[5px] lg:px-10 py-6">
        <div className="grid lg:grid-cols-[minmax(0,1fr)_382px] gap-4 items-start">
          <div className="bg-white rounded-3xl px-4 pb-2">
            <Sk className="h-7 w-16 mt-4" />
            <div className="h-[46px] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Sk className="w-5 h-5 rounded" />
                <Sk className="h-4 w-8" />
              </div>
              <div className="flex gap-1">
                <Sk className="w-[30px] h-[30px] rounded-full" />
                <Sk className="w-[30px] h-[30px] rounded-full" />
                <Sk className="w-[30px] h-[30px] rounded-full" />
              </div>
            </div>
            {[0, 1, 2].map((n) => (
              <div key={n} className="flex gap-[15px] py-4">
                <Sk className="w-[102px] h-[136px] rounded-[10px] shrink-0" />
                <div className="flex-1">
                  <Sk className="h-4 w-2/3" />
                  <Sk className="h-4 w-1/3 mt-1.5" />
                  <Sk className="h-4 w-40 mt-2" />
                  <div className="flex gap-2 mt-2.5">
                    <Sk className="w-[112px] h-9 rounded-full" />
                    <Sk className="w-[178px] h-9 rounded-xl" />
                  </div>
                </div>
                <Sk className="w-[180px] h-10 shrink-0" />
              </div>
            ))}
          </div>
          <div className="bg-white rounded-3xl p-4">
            <Sk className="h-6 w-44" />
            <Sk className="w-full h-[49px] rounded-xl mt-3" />
          </div>
        </div>
      </div>
    </div>
  )
}
