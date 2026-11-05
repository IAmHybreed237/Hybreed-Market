"use client"

import { useState } from "react"
import { ArrowDownIcon } from "@/icons"
import { saveReg } from "./reg"
import { useStepNav } from "./StepShell"

const CMFlag = () => (
  <svg
    width="18"
    height="13"
    viewBox="0 0 18 13"
    className="rounded-[2px] overflow-hidden shrink-0"
    aria-hidden
  >
    <rect width="6" height="13" fill="#009e60" />
    <rect x="6" width="6" height="13" fill="#ce1126" />
    <rect x="12" width="6" height="13" fill="#fcd116" />
    <path
      d="M9 3.9l.8 2.3h2.4l-1.9 1.5.7 2.3L9 8.6l-1.9 1.4.7-2.3-1.9-1.5h2.4z"
      fill="#fcd116"
    />
  </svg>
)

const CITIES = [
  "Douala",
  "Yaoundé",
  "Bafoussam",
  "Bamenda",
  "Buea",
  "Limbe",
  "Kumba",
  "Mutengene",
  "Tiko",
  "Muyuka",
  "Mbouda",
  "Bandjoun",
  "Bangangté",
  "Dschang",
  "Foumban",
  "Bafang",
  "Edéa",
  "Kribi",
  "Ebolowa",
  "Sangmélima",
  "Ambam",
  "Ngaoundéré",
  "Garoua",
  "Maroua",
  "Kousseri",
  "Mokolo",
  "Mora",
  "Guider",
  "Yagoua",
  "Bertoua",
  "Batouri",
  "Abong-Mbang",
  "Mamfé",
  "Kumbo",
  "Wum",
  "Nkambe",
  "Fundong",
  "Mbengwi",
  "Bafut",
  "Mbalmayo",
  "Nkoteng",
  "Bafia",
  "Obala",
  "Akonolinga",
  "Eseka",
  "Somewhere else in Cameroon",
]

const fieldCls =
  "w-full h-[46px] px-[14px] border border-[#D9D9E0] rounded-[10px] bg-white focus:border-[#1F1F23] focus:outline-none text-[15px] text-[#1F1F23]"

export const CityStep = () => {
  const go = useStepNav()
  const [city, setCity] = useState("")

  const continueToSignup = () => {
    if (!city) return
    saveReg({ city })
    go("/partners/signup/contact")
  }

  return (
    <div className="w-full lg:flex lg:items-start lg:justify-center lg:gap-16 xl:gap-24">
      <div className="lg:w-[380px] xl:w-[440px] lg:shrink-0 lg:pt-1">
        <h1 className="text-[28px] leading-[34px] lg:text-[40px] lg:leading-[48px] font-extrabold tracking-[-0.02em] text-[#1F1F23]">
          Select city
        </h1>
        <p className="mt-3 text-[15px] lg:text-[16px] leading-[22px] text-[#1F1F23]">
          Welcome to the Hybreed Partners registration page!
          <br />
          Select a city where your business is located
        </p>
      </div>

      <form
        className="mt-8 lg:mt-1 flex flex-col gap-5 w-full max-w-[420px] lg:w-[420px] lg:shrink-0"
        onSubmit={(e) => {
          e.preventDefault()
          continueToSignup()
        }}
      >
        <div>
          <label htmlFor="country" className="block text-[14px] leading-[20px] text-[#1F1F23] mb-1.5">
            Country of registration
          </label>
          <div
            aria-describedby="country-note"
            className={`${fieldCls} flex items-center gap-2.5 text-[#6B6B75] select-none`}
          >
            <CMFlag />
            Cameroon
          </div>
          <p id="country-note" className="mt-1.5 text-[13px] leading-[18px] text-[#8A8A96]">
            Hybreed is currently only open to sellers in Cameroon.
          </p>
        </div>

        <div>
          <label htmlFor="city" className="block text-[14px] leading-[20px] text-[#1F1F23] mb-1.5">
            City / town
          </label>
          <div className="relative">
            <select
              id="city"
              required
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className={`${fieldCls} appearance-none pr-[40px] cursor-pointer ${
                city ? "" : "text-[#8A8A96]"
              }`}
            >
              <option value="" disabled>
                Select
              </option>
              {CITIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <span className="absolute right-[13px] top-1/2 -translate-y-1/2 text-[#1F1F23] pointer-events-none">
              <ArrowDownIcon size={18} />
            </span>
          </div>
        </div>

        <button
          type="submit"
          disabled={!city}
          className="mt-1 w-full h-[46px] rounded-[10px] bg-[#1F1F23] text-white text-[16px] font-semibold hover:bg-[#34343c] active:scale-[0.99] transition disabled:opacity-40 disabled:hover:bg-[#1F1F23] disabled:cursor-not-allowed"
        >
          Continue
        </button>

        <p className="text-[13px] leading-[18px] text-[#8A8A96]">
          You can change this later in your seller settings.
        </p>
      </form>
    </div>
  )
}
