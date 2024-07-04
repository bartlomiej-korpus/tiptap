import React, {
  createRef,
  useCallback, useImperativeHandle,
  useState,
} from 'react'
import ReactDOM from 'react-dom'

import { ReactRenderer } from './ReactRenderer.js'

type PortalHolderState = {
    portalKey: string | null,
    renderer: ReactRenderer | null
    ref: React.MutableRefObject<PortalHandle>
}

type PortalHandle = {
    forceUpdate: () => void
} | null

type HoldersStates = PortalHolderState[]

type PortalProps = {
    portalKey: string,
    reactElement: ReactRenderer['reactElement'],
    element: ReactRenderer['element']
}

const Portal = React.memo(({ portalKey, reactElement, element }: PortalProps) => {
  return ReactDOM.createPortal(reactElement, element, portalKey)
})

type PortalHolderProps = {
    holdersStates: HoldersStates
    index: number
}

const PortalHolder = React.memo((props: PortalHolderProps) => {
  const [, updateState] = useState({})
  const forceUpdate = useCallback(() => updateState({}), [])

  const holderState = props.holdersStates.at(props.index)

  useImperativeHandle(holderState?.ref, () => {
    return {
      forceUpdate,
    }
  }, [forceUpdate])

  const hasNext = props.holdersStates.length > props.index + 1

  const renderer = holderState?.renderer

  return (<div>
        {renderer && <Portal portalKey={renderer.id} reactElement={renderer.reactElement} element={renderer.element} />}
        {hasNext && <PortalHolder holdersStates={props.holdersStates} index={props.index + 1} />}
    </div>)
})

export type PortalsHandle = {
    setRenderer: (id: string, renderer: ReactRenderer) => void
    removeRenderer: (id: string) => void
} | null

const emptyHolder: () => PortalHolderState = () => ({
  portalKey: null,
  renderer: null,
  ref: createRef<PortalHandle>(),
})

export const createPortals = () => {
  const holdersStates: HoldersStates = [emptyHolder()]

  return {
    setRenderer: (id: string, renderer: ReactRenderer) => {

      const alreadyExists = holdersStates.find(holder => holder.portalKey === id)

      if (alreadyExists) {
        alreadyExists.renderer = renderer
        alreadyExists.ref.current?.forceUpdate()
        return
      }

      const firstEmptyPlace = holdersStates.find(holder => !holder.portalKey)

      if (firstEmptyPlace) {
        firstEmptyPlace.portalKey = id
        firstEmptyPlace.renderer = renderer
        firstEmptyPlace.ref.current?.forceUpdate()
        return
      }

      holdersStates.push({
        portalKey: id,
        renderer,
        ref: React.createRef<PortalHandle>(),
      })

      holdersStates[holdersStates.length - 2]?.ref.current?.forceUpdate()
    },
    removeRenderer: (id: string) => {
      const targetHolder = holdersStates.find(holder => holder.portalKey === id)

      if (!targetHolder) {
        return
      }

      targetHolder.portalKey = null
      targetHolder.renderer = null
      targetHolder.ref.current?.forceUpdate()
    },
    holdersStates,
  }
}

export type PortalsState = ReturnType<typeof createPortals>

export const Portals = (props: {portals: PortalsState}) => {

  return <PortalHolder holdersStates={props.portals.holdersStates} index={0} />
}
