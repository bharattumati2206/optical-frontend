import { useEffect, useMemo, useState } from 'react'
import PropTypes from 'prop-types'
import { StoreContext } from './StoreContextObject'
import { storeService } from '../services/storeService'
import { getListData } from '../utils/api'
import { useAuth } from './useAuth'

export function StoreProvider({ children }) {
  const { user } = useAuth()
  const [stores, setStores] = useState([])
  const [selectedStore, setSelectedStore] = useState(null)
  const [loadingStores, setLoadingStores] = useState(true)
  const [storeError, setStoreError] = useState('')

  const isSuperAdmin = user?.role === 'SUPER_ADMIN'

  useEffect(() => {
    if (!user) {
      setStores([])
      setSelectedStore(null)
      setStoreError('')
      setLoadingStores(false)
      return
    }

    if (!isSuperAdmin) {
      const normalizedStoreId = Number(user.storeId)
      const hasAssignedStore = Number.isFinite(normalizedStoreId) && normalizedStoreId > 0

      if (hasAssignedStore) {
        setStores([{ id: normalizedStoreId }])
        setSelectedStore({ id: normalizedStoreId })
        setStoreError('')
      } else {
        setStores([])
        setSelectedStore(null)
        setStoreError('No store assigned. Contact admin.')
      }

      setLoadingStores(false)
      return
    }

    let active = true

    async function fetchStores() {
      setLoadingStores(true)
      setStoreError('')

      try {
        const data = await storeService.getStores()
        const list = getListData(data)

        if (!active) {
          return
        }

        setStores(list)

        if (list.length === 0) {
          setSelectedStore(null)
          setStoreError('No store assigned. Contact admin.')
        } else {
          setSelectedStore(null)
        }
      } catch (err) {
        if (!active) {
          return
        }

        const status = err?.response?.status
        if (status === 401) {
          setStoreError('Unauthorized. Please login again.')
        } else if (status === 403) {
          setStoreError('Forbidden. Your role is not allowed to access stores.')
        } else {
          setStoreError(err?.response?.data?.message || 'Unable to load stores.')
        }

        setStores([])
        setSelectedStore(null)
      } finally {
        if (active) {
          setLoadingStores(false)
        }
      }
    }

    fetchStores()

    return () => {
      active = false
    }
  }, [user])

  const selectStore = (store) => {
    setSelectedStore(store)
  }

  const value = useMemo(
    () => ({
      stores,
      selectedStore,
      loadingStores,
      storeError,
      isSuperAdmin,
      selectStore,
    }),
    [stores, selectedStore, loadingStores, storeError, isSuperAdmin],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

StoreProvider.propTypes = {
  children: PropTypes.node.isRequired,
}
