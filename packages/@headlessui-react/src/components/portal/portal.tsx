import React, {
  Fragment,
  createContext,
  useContext,
  useEffect,
  useState,

  // Types
  ElementType,
  MutableRefObject,
} from 'react'
import { createPortal } from 'react-dom'

import { Props } from '../../types'
import { render } from '../../utils/render'
import { useIsoMorphicEffect } from '../../hooks/use-iso-morphic-effect'
import { usePortalRoot } from '../../internal/portal-force-root'
import { useServerHandoffComplete } from '../../hooks/use-server-handoff-complete'

// usePortalTarget 可以取得 portal 的 DOM node
function usePortalTarget(): HTMLElement | null {
  let forceInRoot = usePortalRoot()
  let groupTarget = useContext(PortalGroupContext)
  let [target, setTarget] = useState(() => {
    console.log('[usePortalTarget]', {
      forceInRoot,
      groupTarget,
    })

    // Group context is used, but still null
    if (!forceInRoot && groupTarget !== null) return null

    // No group context is used, let's create a default portal root
    if (typeof window === 'undefined') return null
    let existingRoot = document.getElementById('headlessui-portal-root')
    if (existingRoot) return existingRoot // 如果存在就回傳

    // 如果 portal root 還不存在，就建立在 DOM 上
    // <div id="headlessui-portal-root"></div>
    let root = document.createElement('div')
    root.setAttribute('id', 'headlessui-portal-root')
    return document.body.appendChild(root) // 直接 append 在 body 上
  })

  useEffect(() => {
    if (forceInRoot) return
    if (groupTarget === null) return
    setTarget(groupTarget.current)
  }, [groupTarget, setTarget, forceInRoot])

  return target
}

// ---

let DEFAULT_PORTAL_TAG = Fragment
interface PortalRenderPropArg {}

export function Portal<TTag extends ElementType = typeof DEFAULT_PORTAL_TAG>(
  props: Props<TTag, PortalRenderPropArg>
) {
  let passthroughProps = props
  let target = usePortalTarget()
  // element 會是在 target 內的一個空 div
  let [element] = useState<HTMLDivElement | null>(() => {
    const element = document.createElement('div')
    element.setAttribute('id', 'xxx-i-am-portal')
    return typeof window === 'undefined' ? null : element
  })

  let ready = useServerHandoffComplete()

  useIsoMorphicEffect(() => {
    if (!target) return
    if (!element) return

    // 把 element append 在 portal DOM node 上
    target.appendChild(element)

    return () => {
      if (!target) return
      if (!element) return

      // 把 element 移除
      target.removeChild(element)

      // 如果 target 內沒其他 Node，就把 target 移除
      if (target.childNodes.length <= 0) {
        target.parentElement?.removeChild(target)
      }
    }
  }, [target, element])

  if (!ready) return null

  return !target || !element
    ? null
    : // 把 Portal Component render 在 element 上
      createPortal(
        render({ props: passthroughProps, defaultTag: DEFAULT_PORTAL_TAG, name: 'Portal' }),
        element
      )
}

// ---

let DEFAULT_GROUP_TAG = Fragment
interface GroupRenderPropArg {}

let PortalGroupContext = createContext<MutableRefObject<HTMLElement | null> | null>(null)

function Group<TTag extends ElementType = typeof DEFAULT_GROUP_TAG>(
  props: Props<TTag, GroupRenderPropArg> & {
    target: MutableRefObject<HTMLElement | null>
  }
) {
  let { target, ...passthroughProps } = props

  return (
    <PortalGroupContext.Provider value={target}>
      {render({
        props: passthroughProps,
        defaultTag: DEFAULT_GROUP_TAG,
        name: 'Popover.Group',
      })}
    </PortalGroupContext.Provider>
  )
}

// ---

Portal.Group = Group
