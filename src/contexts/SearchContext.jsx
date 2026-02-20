import { createContext, useContext, useState } from 'react'

const SearchContext = createContext({ searchValue: '', setSearchValue: () => {} })

export function SearchProvider({ children }) {
  const [searchValue, setSearchValue] = useState('')
  return (
    <SearchContext.Provider value={{ searchValue, setSearchValue }}>
      {children}
    </SearchContext.Provider>
  )
}

export function useSearch() {
  return useContext(SearchContext)
}
