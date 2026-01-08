import { DynamicModule, Global, Module } from '@nestjs/common'
import { APP_INTERCEPTOR } from '@nestjs/core'
import { PrometheusModule } from '@willsoto/nestjs-prometheus'
import { HttpMetricsInterceptor } from './http-metrics.interceptor'
import { MetricsService } from './metrics.service'

export interface MetricsModuleOptions {
  enabled: boolean
  path: string
  defaultMetrics: boolean
  serviceName: string
}

export interface MetricsModuleAsyncOptions {
  imports?: any[]
  useFactory: (...args: any[]) => MetricsModuleOptions | Promise<MetricsModuleOptions>
  inject?: any[]
}

@Global()
@Module({})
export class MetricsModule {
  static forRoot(options: MetricsModuleOptions): DynamicModule {
    if (!options.enabled) {
      return {
        module: MetricsModule,
        providers: [
          { provide: 'METRICS_OPTIONS', useValue: options },
          MetricsService,
        ],
        exports: [MetricsService, 'METRICS_OPTIONS'],
      }
    }

    return {
      module: MetricsModule,
      imports: [
        PrometheusModule.register({
          path: options.path,
          defaultMetrics: {
            enabled: options.defaultMetrics,
            config: {
              prefix: `${options.serviceName}_`,
            },
          },
          defaultLabels: {
            service: options.serviceName,
          },
        }),
      ],
      providers: [
        { provide: 'METRICS_OPTIONS', useValue: options },
        MetricsService,
        { provide: APP_INTERCEPTOR, useClass: HttpMetricsInterceptor },
      ],
      exports: [MetricsService, PrometheusModule, 'METRICS_OPTIONS'],
    }
  }

  static forRootAsync(asyncOptions: MetricsModuleAsyncOptions): DynamicModule {
    return {
      module: MetricsModule,
      imports: [
        ...(asyncOptions.imports || []),
        PrometheusModule.registerAsync({
          imports: asyncOptions.imports,
          useFactory: async (...args: any[]) => {
            const options = await asyncOptions.useFactory(...args)
            if (!options.enabled) {
              return {
                path: options.path,
                defaultMetrics: { enabled: false },
              }
            }
            return {
              path: options.path,
              defaultMetrics: {
                enabled: options.defaultMetrics,
                config: {
                  prefix: `${options.serviceName}_`,
                },
              },
              defaultLabels: {
                service: options.serviceName,
              },
            }
          },
          inject: asyncOptions.inject,
        }),
      ],
      providers: [
        {
          provide: 'METRICS_OPTIONS',
          useFactory: asyncOptions.useFactory,
          inject: asyncOptions.inject,
        },
        MetricsService,
        { provide: APP_INTERCEPTOR, useClass: HttpMetricsInterceptor },
      ],
      exports: [MetricsService, PrometheusModule, 'METRICS_OPTIONS'],
    }
  }
}
