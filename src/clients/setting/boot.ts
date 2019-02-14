(async () => {
  console.info(`SVG Type Writer v${window.version} Setting App Boot`)
  let lang = ""

  if (window.langs.includes(navigator.language)) {
    lang = navigator.language
  } else {
    lang = window.langs.find(x => x.split("-")[0] === navigator.language)
    if (lang == null) lang = "en-US"
  }

  localStorage.setItem("lang", lang)

  const langVer = `${window.version}.${lang}`
  const currentLocale = localStorage.getItem("locale")
  const localeKey = localStorage.getItem("localeKey")

  if (currentLocale == null || localeKey !== langVer) {
    const locale = await fetch(`/assets/locales/${lang}.json?ver=${window.version}`)
      .then(response => response.json())
    localStorage.setItem("locale", JSON.stringify(locale))
    localStorage.setItem("localeKey", langVer)
  }
  console.info(`Boot Completed`)
})()
