import React, {
  createRef,
  forwardRef, useCallback, useImperativeHandle, useRef, useState,
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

type HoldersStatesRef = React.MutableRefObject<PortalHolderState[]>

type PortalProps = {
    portalKey: string,
    reactElement: ReactRenderer['reactElement'],
    element: ReactRenderer['element']
}

const Portal = React.memo(({ portalKey, reactElement, element }: PortalProps) => {
  return ReactDOM.createPortal(reactElement, element, portalKey)
})

type PortalHolderProps = {
    holdersStatesRef: HoldersStatesRef
    index: number
}

const PortalHolder = React.memo((props: PortalHolderProps) => {
  const [, updateState] = useState({})
  const forceUpdate = useCallback(() => updateState({}), [])

  const holderState = props.holdersStatesRef.current.at(props.index)

  useImperativeHandle(holderState?.ref, () => {
    return {
      forceUpdate,
    }
  }, [forceUpdate])

  const hasNext = props.holdersStatesRef.current.length > props.index + 1

  const renderer = holderState?.renderer

  return (<div>
        {renderer && <Portal portalKey={renderer.id} reactElement={renderer.reactElement} element={renderer.element} />}
        {hasNext && <PortalHolder holdersStatesRef={props.holdersStatesRef} index={props.index + 1} />}
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

export const Portals = forwardRef<PortalsHandle, {}>((props, ref) => {
  const holdersStatesRef = useRef<PortalHolderState[]>([emptyHolder()])

  const setRenderer = useCallback((id: string, renderer: ReactRenderer) => {

    const alreadyExists = holdersStatesRef.current.find(holder => holder.portalKey === id)

    if (alreadyExists) {
      alreadyExists.renderer = renderer
      alreadyExists.ref.current?.forceUpdate()
      return
    }

    const firstEmptyPlace = holdersStatesRef.current.find(holder => !holder.portalKey)

    if (firstEmptyPlace) {
      firstEmptyPlace.portalKey = id
      firstEmptyPlace.renderer = renderer
      firstEmptyPlace.ref.current?.forceUpdate()
      return
    }

    holdersStatesRef.current.push({
      portalKey: id,
      renderer,
      ref: React.createRef<PortalHandle>(),
    })

    holdersStatesRef.current[holdersStatesRef.current.length - 2].ref.current?.forceUpdate()
  }, [holdersStatesRef])

  const removeRenderer = useCallback((id: string) => {
    const targetHolder = holdersStatesRef.current.find(holder => holder.portalKey === id)

    if (!targetHolder) {
      return
    }

    targetHolder.portalKey = null
    targetHolder.renderer = null
    targetHolder.ref.current?.forceUpdate()
  }, [holdersStatesRef])

  useImperativeHandle(ref, () => {
    return {
      setRenderer,
      removeRenderer,
    }
  })

  return <PortalHolder holdersStatesRef={holdersStatesRef} index={0} />
})
